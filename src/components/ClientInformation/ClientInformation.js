import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Sidebar from '../Sidebar/Sidebar';
import './ClientInformation.css';
import { Link } from 'react-router-dom';

const ClientInformation = () => {
  const [unallocatedClients, setUnallocatedClients] = useState([]);
  const [allocatedClients, setAllocatedClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const clientsRef = collection(db, 'Clients');
      const unallocatedQuery = query(clientsRef, where('status', '==', 'unallocated'));
      const allocatedQuery = query(clientsRef, where('status', '==', 'allocated'));

      const unallocatedSnapshot = await getDocs(unallocatedQuery);
      const allocatedSnapshot = await getDocs(allocatedQuery);

      const unallocatedList = await Promise.all(unallocatedSnapshot.docs.map(async (doc) => {
        const client = doc.data();
        const applicationsQuery = query(collection(db, 'Applications'), where('auto_filled_form_data.client_id', '==', client.client_id));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const application = applicationsSnapshot.docs[0]?.data();

        return { ...client, application };
      }));

      const allocatedList = await Promise.all(allocatedSnapshot.docs.map(async (doc) => {
        const client = doc.data();
        const applicationsQuery = query(collection(db, 'Applications'), where('auto_filled_form_data.client_id', '==', client.client_id));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const application = applicationsSnapshot.docs[0]?.data();

        return { ...client, application };
      }));

      const agentsSnapshot = await getDocs(collection(db, 'Agents'));
      const agentsList = agentsSnapshot.docs.map(doc => doc.data());

      setUnallocatedClients(unallocatedList);
      setAllocatedClients(allocatedList);
      setAgents(agentsList);
    };

    fetchData();
  }, []);

  const handleAssignAgent = (client) => {
    setSelectedClient(client);
    setShowAssignPopup(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedClient || !selectedAgent) return;

    try {
      const clientRef = collection(db, 'Clients');
      const clientQuery = query(clientRef, where('client_id', '==', selectedClient.client_id));
      const clientSnapshot = await getDocs(clientQuery);

      if (!clientSnapshot.empty) {
        const clientDoc = clientSnapshot.docs[0];
        await updateDoc(clientDoc.ref, {
          assigned_agent_id: selectedAgent,
          status: 'allocated'
        });

        setAllocatedClients([...allocatedClients, { ...selectedClient, assigned_agent_id: selectedAgent, status: 'allocated' }]);
        setUnallocatedClients(unallocatedClients.filter(client => client.client_id !== selectedClient.client_id));
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
    }

    setShowAssignPopup(false);
    setShowConfirmPopup(false);
  };

  return (
    <div className="client-information">
      <Sidebar />
      <div className="main-content-CI">
        <h1>Client Information</h1>
        
        <div className="content-header">
          <h2>Unallocated</h2>
          <div className="table-header">
            <div className="column">Name</div>
            <div className="column">Request Summary</div>
            <div className="column">Original Request</div>
            <div className="column">Documents</div>
            <div className="column">County</div>
            <div className="column">Agent</div>
          </div>
        </div>
        {unallocatedClients.map(client => (
          <div className="card" key={client.client_id}>
            <div className="column name">
              <img src={client.profile_photo_url} alt={client.full_name} /> {client.full_name}
            </div>
            <div className="column request-summary">
              {client.application?.application_summary || 'N/A'}
            </div>
            <div className="column original-request">
              {client.application?.filled_form ? (
                <Link to={client.application.filled_form} target="_blank">
                  <button className="btn btn-primary">See request</button>
                </Link>
              ) : 'N/A'}
            </div>
            <div className="column documents">
              {client.application?.uploaded_documents_path ? (
                Object.keys(client.application.uploaded_documents_path).map((docKey, index) => (
                  <div key={index}>
                    <Link to={client.application.uploaded_documents_path[docKey][1]} target="_blank">
                      <button className="btn btn-primary">{docKey}</button>
                    </Link>
                  </div>
                ))
              ) : 'N/A'}
            </div>
            <div className="column county">
              {client.county}
            </div>
            <div className="column assign-agent">
              <button className="btn btn-secondary" onClick={() => handleAssignAgent(client)}>Assign agent</button>
            </div>
          </div>
        ))}

        <div className="content-header">
          <h2>Allocated</h2>
          <div className="table-header">
            <div className="column">Name</div>
            <div className="column">Onboard Program</div>
            <div className="column">Original Request</div>
            <div className="column">Documents</div>
            <div className="column">County</div>
            <div className="column">Agent</div>
          </div>
        </div>
        {allocatedClients.map(client => (
          <div className="card" key={client.client_id}>
            <div className="column name">
              <img src={client.profile_photo_url} alt={client.full_name} /> {client.full_name}
              </div>
              <div className="column onboard-program">
                {client.application?.final_program_name || 'N/A'}
              </div>
              <div className="column original-request">
                {client.application?.filled_form ? (
                  <Link to={client.application.filled_form} target="_blank">
                    <button className="btn btn-primary">See request</button>
                  </Link>
                ) : 'N/A'}
              </div>
              <div className="column documents">
                {client.application?.uploaded_documents_path ? (
                  Object.keys(client.application.uploaded_documents_path).map((docKey, index) => (
                    <div key={index}>
                      <Link to={client.application.uploaded_documents_path[docKey][1]} target="_blank">
                        <button className="btn btn-primary">{docKey}</button>
                      </Link>
                    </div>
                  ))
                ) : 'N/A'}
              </div>
              <div className="column county">
                {client.county}
              </div>
              <div className="column agent">
                {client.assigned_agent_id || 'N/A'}
              </div>
            </div>
          ))}

          {showAssignPopup && (
            <div className="popup">
              <div className="popup-content">
                <h3>Select an agent</h3>
                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  <option value="">Select agent</option>
                  {agents.map((agent, index) => (
                    <option key={index} value={agent.displayName}>{agent.displayName}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={() => setShowConfirmPopup(true)}>Confirm</button>
                <button className="btn btn-secondary" onClick={() => setShowAssignPopup(false)}>Cancel</button>
              </div>
            </div>
          )}

          {showConfirmPopup && (
            <div className="confirm-popup">
              <div className="confirm-popup-content">
                <h3>Are you sure you want to assign this agent?</h3>
                <button className="btn btn-primary" onClick={handleConfirmAssign}>Yes</button>
                <button className="btn btn-secondary" onClick={() => setShowConfirmPopup(false)}>No</button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default ClientInformation;
