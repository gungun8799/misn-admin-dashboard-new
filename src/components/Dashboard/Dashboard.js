import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Sidebar from '../Sidebar/Sidebar';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Line, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';


const Dashboard = () => {
  const [casesHandled, setCasesHandled] = useState(0);
  const [issuesToday, setIssuesToday] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [agentsOnDuty, setAgentsOnDuty] = useState(0);
  const [statusData, setStatusData] = useState({
    completed: 0,
    totalApplications: 0,
    ticketIssues: 0,
    totalVisits: 0,
    successfulVisits: 0,
    totalTickets: 0,
    closedTickets: 0,
  });
  const [topAgents, setTopAgents] = useState([]);
  const [agentLoadData, setAgentLoadData] = useState({
    averageClients: 0,
    maxClients: 0,
    averageApplications: 0,
    maxApplications: 0,
    averageTickets: 0,
    maxTickets: 0,
  });
  const [trendData, setTrendData] = useState({});
  const [trendType, setTrendType] = useState('clients');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        const tomorrowTimestamp = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));

        // Fetch cases handled today
        const casesHandledSnapshot = await getDocs(query(collection(db, 'Applications'), where('auto_filled_form_data.created_at', '>=', todayTimestamp), where('auto_filled_form_data.created_at', '<', tomorrowTimestamp)));
        setCasesHandled(casesHandledSnapshot.size);

        // Fetch issues today
        const issuesTodaySnapshot = await getDocs(query(collection(db, 'Tickets'), where('created_at', '>=', todayTimestamp), where('created_at', '<', tomorrowTimestamp)));
        setIssuesToday(issuesTodaySnapshot.size);

        // Fetch new clients today
        const newClientsSnapshot = await getDocs(query(collection(db, 'Clients'), where('created_at', '>=', todayTimestamp), where('created_at', '<', tomorrowTimestamp)));
        setNewClients(newClientsSnapshot.size);

        // Fetch agents visits today
        const agentsVisitsSnapshot = await getDocs(query(collection(db, 'Visits'), where('scheduled_date', '>=', todayTimestamp), where('scheduled_date', '<', tomorrowTimestamp)));
        setAgentsOnDuty(agentsVisitsSnapshot.size);

        // Fetch total applications and completed applications
        const totalApplicationsSnapshot = await getDocs(collection(db, 'Applications'));
        const completedApplicationsSnapshot = await getDocs(query(collection(db, 'Applications'), where('auto_filled_form_data.status', '==', 'service_received')));

        // Fetch total visits and successful visits
        const totalVisitsSnapshot = await getDocs(collection(db, 'Visits'));
        const successfulVisitsSnapshot = await getDocs(query(collection(db, 'Visits'), where('visit_result', '==', 'successful')));

        // Fetch total and closed tickets
        const totalTicketsSnapshot = await getDocs(collection(db, 'Tickets'));
        const closedTicketsSnapshot = await getDocs(query(collection(db, 'Tickets'), where('status', '==', 'closed')));

        // Fetch agents and clients data for agent load
        const agentsSnapshot = await getDocs(collection(db, 'Agents'));
        const clientsSnapshot = await getDocs(collection(db, 'Clients'));
        const applicationsSnapshot = await getDocs(collection(db, 'Applications'));
        const ticketsSnapshot = await getDocs(collection(db, 'Tickets'));

        const totalAgents = agentsSnapshot.size;
        const totalClients = clientsSnapshot.size;
        const totalApplications = applicationsSnapshot.size;
        const totalTickets = ticketsSnapshot.size;

        // Calculate max clients per agent
        const agentClientCounts = {};
        clientsSnapshot.docs.forEach(doc => {
          const assignedAgentId = doc.data().assigned_agent_id;
          if (assignedAgentId) {
            if (!agentClientCounts[assignedAgentId]) {
              agentClientCounts[assignedAgentId] = 0;
            }
            agentClientCounts[assignedAgentId]++;
          }
        });
        const maxClients = Math.max(...Object.values(agentClientCounts));

        // Calculate max applications per agent
        const agentApplicationCounts = {};
        applicationsSnapshot.docs.forEach(doc => {
          const clientId = doc.data().auto_filled_form_data.client_id;
          if (clientId) {
            if (!agentApplicationCounts[clientId]) {
              agentApplicationCounts[clientId] = 0;
            }
            agentApplicationCounts[clientId]++;
          }
        });
        const maxApplications = Math.max(...Object.values(agentApplicationCounts));

        // Calculate max tickets per agent
        const agentTicketCounts = {};
        ticketsSnapshot.docs.forEach(doc => {
          const agentId = doc.data().agent_id;
          if (agentId) {
            if (!agentTicketCounts[agentId]) {
              agentTicketCounts[agentId] = 0;
            }
            agentTicketCounts[agentId]++;
          }
        });
        const maxTickets = Math.max(...Object.values(agentTicketCounts));

        // Find top three agents by client count
        const sortedAgents = Object.entries(agentClientCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([agentId, clientCount]) => {
          return {
            agentId,
            clientCount,
          };
        });

        const topAgentsData = await Promise.all(sortedAgents.map(async ({ agentId, clientCount }) => {
          const agentDoc = await getDocs(query(collection(db, 'Agents'), where('displayName', '==', agentId)));
          const agentData = agentDoc.docs[0]?.data();
          return {
            ...agentData,
            clientCount,
          };
        }));

        setStatusData({
          completed: completedApplicationsSnapshot.size,
          totalApplications: totalApplicationsSnapshot.size,
          ticketIssues: issuesTodaySnapshot.size,
          totalVisits: totalVisitsSnapshot.size,
          successfulVisits: successfulVisitsSnapshot.size,
          totalTickets: totalTicketsSnapshot.size,
          closedTickets: closedTicketsSnapshot.size,
        });

        setAgentLoadData({
          averageClients: totalClients / totalAgents,
          maxClients,
          averageApplications: totalApplications / totalAgents,
          maxApplications,
          averageTickets: totalTickets / totalAgents,
          maxTickets,
        });

        setTopAgents(topAgentsData);
        fetchTrendData('clients'); // Initialize with the clients trend data

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchTrendData = async (type) => {
    try {
      let data = [];
      switch (type) {
        case 'clients':
          const clientsSnapshot = await getDocs(collection(db, 'Clients'));
          data = clientsSnapshot.docs.map(doc => ({
            date: doc.data().created_at.toDate(),
            count: 1
          }));
          break;

        case 'applications':
          const applicationsSnapshot = await getDocs(collection(db, 'Applications'));
          data = applicationsSnapshot.docs.map(doc => ({
            date: doc.data().auto_filled_form_data.created_at.toDate(),
            program: doc.data().system_suggest_program,
            count: 1
          }));
          break;

        case 'tickets':
          const ticketsSnapshot = await getDocs(collection(db, 'Tickets'));
          data = ticketsSnapshot.docs.map(doc => ({
            date: doc.data().created_at.toDate(),
            count: 1
          }));
          break;

        default:
          break;
      }

      setTrendData({ type, data });

    } catch (error) {
      console.error(`Error fetching ${type} trend data:`, error);
    }
  };

  const handleTrendTypeChange = (type) => {
    setTrendType(type);
    fetchTrendData(type);
  };

  const renderTrendChart = () => {
    if (!trendData.data) {
      return null;
    }

    const { data, type } = trendData;

    if (type === 'clients') {
      const clientData = data.reduce((acc, curr) => {
        const date = curr.date.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += curr.count;
        return acc;
      }, {});

      const labels = Object.keys(clientData);
      const dataset = {
        labels,
        datasets: [{
          label: 'Clients',
          data: Object.values(clientData),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        }],
      };

      return <Line data={dataset} />;

    } else if (type === 'applications') {
      const appData = data.reduce((acc, curr) => {
        const date = curr.date.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {};
        }
        if (!acc[date][curr.program]) {
          acc[date][curr.program] = 0;
        }
        acc[date][curr.program] += curr.count;
        return acc;
      }, {});

      const labels = Object.keys(appData);
      const programs = Array.from(new Set(data.map(d => d.program)));

      const datasets = programs.map(program => ({
        label: program,
        data: labels.map(label => appData[label][program] || 0),
        backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`,
      }));

      const dataset = {
        labels,
        datasets,
      };

      return <Bar data={dataset} />;

    } else if (type === 'tickets') {
      const ticketData = data.reduce((acc, curr) => {
        const date = curr.date.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += curr.count;
        return acc;
      }, {});

      const labels = Object.keys(ticketData);
      const dataset = {
        labels,
        datasets: [{
          label: 'Tickets',
          data: Object.values(ticketData),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: true,
        }],
      };

      return <Line data={dataset} />;
    }
  };

  const completionPercentage = statusData.totalApplications > 0 ? (statusData.completed / statusData.totalApplications) * 100 : 0;
  const successfulVisitsPercentage = statusData.totalVisits > 0 ? (statusData.successfulVisits / statusData.totalVisits) * 100 : 0;
  const averageClientsPercentage = agentLoadData.maxClients > 0 ? (agentLoadData.averageClients / agentLoadData.maxClients) * 100 : 0;
  const averageApplicationsPercentage = agentLoadData.maxApplications > 0 ? (agentLoadData.averageApplications / agentLoadData.maxApplications) * 100 : 0;
  const closedTicketsPercentage = statusData.totalTickets > 0 ? (statusData.closedTickets / statusData.totalTickets) * 100 : 0;
  const averageTicketsPercentage = agentLoadData.maxTickets > 0 ? (agentLoadData.averageTickets / agentLoadData.maxTickets) * 100 : 0;

  const handleAgentClick = () => {
    navigate('/AgentInformation');
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h2>Dashboard</h2>
        </div>
        <div className="todays-card-container">
          <div className="todays-card">
            <h3>Today's Cases Handled</h3>
            <div className="number">{casesHandled}</div>
          </div>
          <div className="todays-card">
            <h3>Today's Issues</h3>
            <div className="number">{issuesToday}</div>
          </div>
          <div className="todays-card">
            <h3>Today's New Clients</h3>
            <div className="number">{newClients}</div>
          </div>
          <div className="todays-card">
            <h3>Today's Agents Visits</h3>
            <div className="number">{agentsOnDuty}</div>
          </div>
        </div>
        <div className="status-container">
          <div className="status-card">
            <h4>Completed</h4>
            <div className="gauge-container">
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={completionPercentage}
                  text={`${Math.round(completionPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="red" />
                      <stop offset="100%" stopColor="green" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Total Applications: {statusData.totalApplications}</p>
                <p>Completed Applications: {statusData.completed}</p>
              </div>
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={successfulVisitsPercentage}
                  text={`${Math.round(successfulVisitsPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient2)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient2" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="blue" />
                      <stop offset="100%" stopColor="green" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Total Visits: {statusData.totalVisits}</p>
                <p>Successful Visits: {statusData.successfulVisits}</p>
              </div>
            </div>
          </div>
          <div className="status-card">
            <h4>Agent Case Load</h4>
            <div className="gauge-container">
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={averageClientsPercentage}
                  text={`${Math.round(averageClientsPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient3)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient3" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="purple" />
                      <stop offset="100%" stopColor="orange" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Average Clients: {agentLoadData.averageClients.toFixed(2)}</p>
                <p>Max Clients: {agentLoadData.maxClients}</p>
              </div>
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={averageApplicationsPercentage}
                  text={`${Math.round(averageApplicationsPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient4)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient4" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="teal" />
                      <stop offset="100%" stopColor="gold" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Average Applications: {agentLoadData.averageApplications.toFixed(2)}</p>
                <p>Max Applications: {agentLoadData.maxApplications}</p>
              </div>
            </div>
          </div>
          <div className="status-card">
            <h4>Tickets</h4>
            <div className="gauge-container">
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={closedTicketsPercentage}
                  text={`${Math.round(closedTicketsPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient5)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient5" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="red" />
                      <stop offset="100%" stopColor="green" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Total Tickets: {statusData.totalTickets}</p>
                <p>Closed Tickets: {statusData.closedTickets}</p>
              </div>
              <div className="gauge">
                <CircularProgressbar
                  className="circular-progressbar"
                  value={averageTicketsPercentage}
                  text={`${Math.round(averageTicketsPercentage)}%`}
                  styles={buildStyles({
                    pathColor: `url(#gradient6)`,
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                  })}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient6" gradientTransform="rotate(90)">
                      <stop offset="0%" stopColor="pink" />
                      <stop offset="100%" stopColor="cyan" />
                    </linearGradient>
                  </defs>
                </svg>
                <p>Average Tickets: {agentLoadData.averageTickets.toFixed(2)}</p>
                <p>Max Tickets: {agentLoadData.maxTickets}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-container">
          <div className="list-container" onClick={handleAgentClick}>
            <h4>Top Agents Information</h4>
            {topAgents.map((agent, index) => (
              <div className="list-item" key={index}>
                <img src={agent.photoURL} alt={agent.displayName} />
                <h5>{agent.displayName}</h5>
                <div className="info">
                  
                  <p>{agent.serving_county.join(', ')}</p>
                </div>
                <div className="clients">
                  <p>{agent.clientCount} Clients</p>
                </div>
              </div>
            ))}
          </div>
          <div className="graph-container">
            <h4>Operation Trends</h4>
            <div className="buttons-container">
              <button onClick={() => handleTrendTypeChange('clients')}>Clients Trend</button>
              <button onClick={() => handleTrendTypeChange('applications')}>Applications Trend</button>
              <button onClick={() => handleTrendTypeChange('tickets')}>Tickets Trend</button>
            </div>
            <div className="graph">
              {renderTrendChart()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
