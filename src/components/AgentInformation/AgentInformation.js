import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import styles from './AgentInformation.module.css';
import Sidebar from '../Sidebar/Sidebar';

const AgentInformation = () => {
  const [agents, setAgents] = useState([]);
  const [clientCounts, setClientCounts] = useState({});
  const [applicationCounts, setApplicationCounts] = useState({});
  const [ticketCounts, setTicketCounts] = useState({});
  const [visitCounts, setVisitCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsQuery = query(collection(db, 'Agents'));
        const agentsSnapshot = await getDocs(agentsQuery);
        const agentsData = agentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAgents(agentsData);
        await fetchCounts(agentsData);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    const fetchCounts = async (agentsData) => {
      try {
        const clientCounts = {};
        const applicationCounts = {};
        const ticketCounts = {};
        const visitCounts = {};

        for (const agent of agentsData) {
          if (!agent.displayName) {
            console.warn(`Agent with ID ${agent.id} does not have a displayName`);
            continue;
          }

          // Fetch clients
          const clientQuery = query(collection(db, 'Clients'), where('assigned_agent_id', '==', agent.displayName));
          const clientSnapshot = await getDocs(clientQuery);
          const clientIds = clientSnapshot.docs.map(doc => doc.data().client_id);
          clientCounts[agent.displayName] = clientIds.length;

          // Fetch applications
          let totalApplications = 0;
          let completedApplications = 0;
          for (const clientId of clientIds) {
            if (!clientId) continue;

            const applicationsQuery = query(
              collection(db, 'Applications'),
              where('auto_filled_form_data.client_id', '==', clientId)
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            totalApplications += applicationsSnapshot.docs.length;

            const completedApplicationsQuery = query(
              collection(db, 'Applications'),
              where('auto_filled_form_data.client_id', '==', clientId),
              where('auto_filled_form_data.status', '==', 'service_received')
            );
            const completedApplicationsSnapshot = await getDocs(completedApplicationsQuery);
            completedApplications += completedApplicationsSnapshot.docs.length;
          }
          applicationCounts[agent.displayName] = {
            completed: completedApplications,
            total: totalApplications,
            percentage: totalApplications > 0 ? (completedApplications / totalApplications) * 100 : 0,
          };

          // Fetch tickets
          const totalTicketsQuery = query(
            collection(db, 'Tickets'),
            where('agent_id', '==', agent.displayName)
          );
          const totalTicketsSnapshot = await getDocs(totalTicketsQuery);
          const totalTickets = totalTicketsSnapshot.docs.length;

          const closedTicketsQuery = query(
            collection(db, 'Tickets'),
            where('agent_id', '==', agent.displayName),
            where('status', '==', 'closed')
          );
          const closedTicketsSnapshot = await getDocs(closedTicketsQuery);
          const closedTickets = closedTicketsSnapshot.docs.length;

          ticketCounts[agent.displayName] = {
            closed: closedTickets,
            total: totalTickets,
            percentage: totalTickets > 0 ? (closedTickets / totalTickets) * 100 : 0,
          };

          // Fetch visits
          const totalVisitsQuery = query(
            collection(db, 'Visits'),
            where('agent_id', '==', agent.displayName)
          );
          const totalVisitsSnapshot = await getDocs(totalVisitsQuery);
          const totalVisits = totalVisitsSnapshot.docs.length;

          const successfulVisitsQuery = query(
            collection(db, 'Visits'),
            where('agent_id', '==', agent.displayName),
            where('visit_result', '==', 'successful')
          );
          const successfulVisitsSnapshot = await getDocs(successfulVisitsQuery);
          const successfulVisits = successfulVisitsSnapshot.docs.length;

          visitCounts[agent.displayName] = {
            successful: successfulVisits,
            total: totalVisits,
            percentage: totalVisits > 0 ? (successfulVisits / totalVisits) * 100 : 0,
          };
        }

        setClientCounts(clientCounts);
        setApplicationCounts(applicationCounts);
        setTicketCounts(ticketCounts);
        setVisitCounts(visitCounts);

      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchAgents();
  }, []);

  const handleAgentClick = (agentId) => {
    navigate(`/DetailAgentInformation/${agentId}`);
  };

  return (
    <div className={styles.agentInformation}>
      <Sidebar />
      <h1>Agent Information</h1>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Number of Clients</th>
            <th>Client's Applications</th>
            <th>Client's Tickets</th>
            <th>Client's Visits</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.id} onClick={() => handleAgentClick(agent.id)}>
              <td>
                <div className={styles.agentDetails}>
                  <img src={agent.photoURL} alt={agent.displayName} />
                  <div>{agent.displayName}</div>
                </div>
              </td>
              <td>
                <div className={styles.client}>
                  {clientCounts[agent.displayName] || 0}
                </div>
              </td>
              <td>
                <div className={styles.pending} title="Completed Applications/Total Applications">
                  <span className={styles.largeNumber}>{applicationCounts[agent.displayName] ? applicationCounts[agent.displayName].completed : 0}</span>
                  /
                  <span className={styles.smallNumber}>{applicationCounts[agent.displayName] ? applicationCounts[agent.displayName].total : 0}</span>
                  <div className={styles.percentage}>
                    {applicationCounts[agent.displayName] && applicationCounts[agent.displayName].total > 0 ? `${applicationCounts[agent.displayName].percentage.toFixed(2)}%` : '0%'}
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.pending} title="Closed Tickets/Total Tickets">
                  <span className={styles.largeNumber}>{ticketCounts[agent.displayName] ? ticketCounts[agent.displayName].closed : 0}</span>
                  /
                  <span className={styles.smallNumber}>{ticketCounts[agent.displayName] ? ticketCounts[agent.displayName].total : 0}</span>
                  <div className={styles.percentage}>
                    {ticketCounts[agent.displayName] && ticketCounts[agent.displayName].total > 0 ? `${ticketCounts[agent.displayName].percentage.toFixed(2)}%` : '0%'}
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.pending} title="Successful Visits/Total Visits">
                  <span className={styles.largeNumber}>{visitCounts[agent.displayName] ? visitCounts[agent.displayName].successful : 0}</span>
                  /
                  <span className={styles.smallNumber}>{visitCounts[agent.displayName] ? visitCounts[agent.displayName].total : 0}</span>
                  <div className={styles.percentage}>
                    {visitCounts[agent.displayName] && visitCounts[agent.displayName].total > 0 ? `${visitCounts[agent.displayName].percentage.toFixed(2)}%` : '0%'}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentInformation;
