import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import styles from './DetailAgentInformation.module.css';
import Sidebar from '../Sidebar/Sidebar';

const DetailAgentInformation = () => {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [clientMessages, setClientMessages] = useState([]);
  const [visitSchedules, setVisitSchedules] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedClientMessage, setSelectedClientMessage] = useState(null);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const agentDoc = await getDoc(doc(db, 'Agents', agentId));
        if (agentDoc.exists()) {
          const agentData = agentDoc.data();
          setAgent(agentData);
          console.log('Agent data:', agentData);

          const clientQuery = query(collection(db, 'Clients'), where('assigned_agent_id', '==', agentData.displayName));
          const clientSnapshot = await getDocs(clientQuery);
          const clientData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClients(clientData);
          console.log('Clients data:', clientData);

          const clientIds = clientData.map(client => client.client_id);
          console.log('Client IDs:', clientIds);

          if (clientIds.length > 0) {
            const applicationsData = [];
            for (const clientId of clientIds) {
              const applicationsQuery = query(collection(db, 'Applications'), where('auto_filled_form_data.client_id', '==', clientId));
              const applicationsSnapshot = await getDocs(applicationsQuery);
              const clientApplications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              applicationsData.push(...clientApplications);
            }
            setApplications(applicationsData);
            console.log('Applications data:', applicationsData);

            const ticketsQuery = query(collection(db, 'Tickets'), where('agent_id', '==', agentData.displayName));
            const ticketsSnapshot = await getDocs(ticketsQuery);
            const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(ticketsData);
            console.log('Tickets data:', ticketsData);

            const clientMessagesData = [];
            for (const clientId of clientIds) {
              const clientMessageDoc = await getDoc(doc(db, 'AgentChat', clientId));
              if (clientMessageDoc.exists()) {
                clientMessagesData.push({ id: clientId, ...clientMessageDoc.data() });
              }
            }
            setClientMessages(clientMessagesData);
            console.log('Client Messages data:', clientMessagesData);

            const visitsQuery = query(collection(db, 'Visits'), where('agent_id', '==', agentData.displayName));
            const visitsSnapshot = await getDocs(visitsQuery);
            const visitsData = visitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVisitSchedules(visitsData);
            console.log('Visit Schedules data:', visitsData);
          }
        } else {
          console.log('No such agent document!');
        }
      } catch (error) {
        console.error('Error fetching agent details:', error);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  const formatTimestamp = (timestamp) => {
    if (timestamp && timestamp.__time__) {
      const date = new Date(timestamp.__time__);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return 'Invalid Date';
  };

  const handleChatLogClick = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseChatLog = () => {
    setSelectedTicket(null);
  };

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
  };

  const handleCloseIssue = () => {
    setSelectedIssue(null);
  };

  const handleClientMessageClick = (clientMessage) => {
    setSelectedClientMessage(clientMessage);
  };

  const handleCloseClientMessage = () => {
    setSelectedClientMessage(null);
  };

  return (
    <div className={styles.detailAgentInformation}>
      <Sidebar />
      {agent && (
        <div className={styles.agentCard}>
          <h1>{agent.displayName}</h1>
        </div>
      )}
      <div className={styles.topicClient}>
        <h2>Clients</h2>
      </div>
      <div className={styles.section}>
        <table className={styles.clientTable}>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Address</th>
              <th>County</th>
              <th>Nationality</th>
              <th>Date of Birth</th>
              <th>Age</th>
              <th>Preferred Language</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td><img src={client.profile_photo_url} alt={client.name} className={styles.clientPhoto} /></td>
                <td>{client.full_name}</td>
                <td>
                  {client.address ? (
                    <>
                      {client.address.address_line_1}<br />
                      {client.address.address_line_2}<br />
                      {client.address.city}, {client.address.zip}
                    </>
                  ) : ''}
                </td>
                <td>{client.county}</td>
                <td>{client.nationality}</td>
                <td>{client.date_of_birth ? new Date(client.date_of_birth.seconds * 1000).toLocaleDateString() : ''}</td>
                <td>{client.age}</td>
                <td>{client.language_preference}</td>
                <td>
                  {client.documents ? client.documents.map((doc, idx) => (
                    <a key={idx} href={doc} target="_blank" rel="noopener noreferrer">Document {idx + 1}</a>
                  )) : 'No documents'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.topicApplication}>
        <h2>Applications</h2>
      </div>
      <div className={`${styles.section} ${styles.applicationCard}`}>
        <table className={styles.clientTable}>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Status</th>
              <th>Final Program Name</th>
              <th>Summary</th>
              <th>Pre-approved Reason</th>
              <th>Pre-rejected Reason</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(application => (
              <tr key={application.id}>
                <td>{application.id}</td>
                <td>{application.auto_filled_form_data.status}</td>
                <td>{application.auto_filled_form_data.final_program_name}</td>
                <td>{application.application_summary || (application.agent_service_submit && application.agent_service_submit[3]) || 'No summary'}</td>
                <td>{application.auto_filled_form_data.pre_approved_reason}</td>
                <td>{application.auto_filled_form_data.pre_rejected_reason}</td>
                <td>{application.auto_filled_form_data.created_at ? formatTimestamp(application.auto_filled_form_data.created_at) : ''}</td>
                <td>{application.auto_filled_form_data.updated_at ? formatTimestamp(application.auto_filled_form_data.updated_at) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.topicTickets}>
        <h2>Tickets</h2>
      </div>
      <div className={`${styles.section} ${styles.ticketsCard}`}>
        <table className={styles.clientTable}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th className={styles.issue}>Issue</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Chat Log</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td className={styles.issue} onClick={() => handleIssueClick(ticket.chat_log[0]?.message || 'No issue')}>{ticket.chat_log[0]?.message || 'No issue'}</td>
                <td>{ticket.status}</td>
                <td>{ticket.created_at ? formatTimestamp(ticket.created_at.toDate()) : ''}</td>
                <td>{ticket.updated_at ? formatTimestamp(ticket.updated_at.toDate()) : ''}</td>
                <td>
                  <button className={styles.buttonViewLog} onClick={() => handleChatLogClick(ticket)}>View Chat Log</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.horizontalContainer}>
        <div className={styles.clientMessagesContainer}>
          <div className={styles.topicClientMessages}>
            <h2>Client Messages</h2>
          </div>
          <div className={`${styles.section} ${styles.clientMessagesCard}`}>
            <table className={styles.clientTable}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>View Full Chat</th>
                </tr>
              </thead>
              <tbody>
                {clientMessages.map(message => (
                  <tr key={message.id}>
                    <td>{clients.find(client => client.client_id === message.id)?.full_name}</td>
                    <td>
                      <button className={styles.buttonViewChat} onClick={() => handleClientMessageClick(message)}>View Full Chat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.visitSchedulesContainer}>
          <div className={styles.topicVisitSchedules}>
            <h2>Visit Schedule</h2>
          </div>
          <div className={`${styles.section} ${styles.visitScheduleCard}`}>
            <table className={styles.clientTable}>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Visit Date</th>
                  <th>Visit Status</th>
                </tr>
              </thead>
              <tbody>
                {visitSchedules.map(visit => (
                  <tr key={visit.id}>
                    <td>{visit.client_id}</td>
                    <td>{visit.scheduled_date ? formatTimestamp(visit.scheduled_date) : ''}</td>
                    <td>{visit.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedTicket && (
        <div className={styles.chatLogModal}>
          <div className={styles.chatLogContent}>
            <div className={styles.chatLogHeader}>
              <h2>Chat Log for Ticket ID: {selectedTicket.id}</h2>
              <button onClick={handleCloseChatLog}>Close</button>
            </div>
            <ul>
              {selectedTicket.chat_log.map((log, index) => (
                <li key={index} className={log.sender === agent.displayName ? styles.agentMessage : styles.clientMessage}>
                  <span className={styles.timestamp}>{log.timestamp ? formatTimestamp(log.timestamp.toDate()) : ''}</span>
                  <span className={styles.sender}>{log.sender ? log.sender + ': ' : ''}</span>
                  {log.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {selectedIssue && (
        <div className={styles.issueModal}>
          <div className={styles.issueContent}>
            <div className={styles.issueHeader}>
              <h2>Issue Detail</h2>
              <button onClick={handleCloseIssue}>Close</button>
            </div>
            <p>{selectedIssue}</p>
          </div>
        </div>
      )}
      {selectedClientMessage && (
        <div className={styles.chatLogModal}>
          <div className={styles.chatLogContent}>
            <div className={styles.chatLogHeader}>
              <h2>Chat Log for Client ID: {selectedClientMessage.id}</h2>
              <button onClick={handleCloseClientMessage}>Close</button>
            </div>
            <ul>
              {[...selectedClientMessage.Agent_chat, ...selectedClientMessage.Client_chat]
                .sort((a, b) => {
                  const timeA = a.timestamp?.__time__ ? new Date(a.timestamp.__time__) : new Date(a.timestamp.seconds * 1000);
                  const timeB = b.timestamp?.__time__ ? new Date(b.timestamp.__time__) : new Date(b.timestamp.seconds * 1000);
                  return timeA - timeB;
                })
                .map((log, index) => (
                  <li key={index} className={log.sender === agent.displayName ? styles.agentMessage : styles.clientMessage}>
                    <span className={styles.timestamp}>{log.timestamp ? formatTimestamp(log.timestamp) : ''}</span>
                    <span className={styles.sender}>{log.sender ? log.sender + ': ' : ''}</span>
                    {log.message}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailAgentInformation;