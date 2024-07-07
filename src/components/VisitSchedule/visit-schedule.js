import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';
import './visit-schedule.css';
import { FaArrowLeft } from 'react-icons/fa';
import BottomBar from '../BottomBar';

const VisitSchedule = ({ setDirection }) => {
  const [agentData, setAgentData] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);
  const [date, setDate] = useState(new Date());
  const [clientList, setClientList] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const agentQuery = query(collection(db, 'Agents'), where('email', '==', user.email));
          const agentSnapshot = await getDocs(agentQuery);
          if (!agentSnapshot.empty) {
            const agent = agentSnapshot.docs[0].data();
            setAgentData(agent);
            fetchAppointments(agent.displayName);
            fetchClients(agent.displayName);
          } else {
            console.error('Agent document does not exist');
          }
        } catch (error) {
          console.error('Error fetching agent document:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAppointments = async (agentName) => {
    try {
      const appointmentsQuery = query(collection(db, 'Visits'), where('agent_id', '==', agentName));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const clientData = await fetchClientsData();
      const appointmentsWithClientNames = appointmentsList.map(appointment => {
        const client = clientData.find(c => c.client_id === appointment.client_id);
        return {
          ...appointment,
          client_full_name: client ? client.full_name : appointment.client_id
        };
      });

      const sortedAppointments = appointmentsWithClientNames.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
      setAppointments(sortedAppointments);
      filterAppointmentsByDate(date, sortedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchClientsData = async () => {
    try {
      const clientsQuery = query(collection(db, 'Clients'));
      const clientsSnapshot = await getDocs(clientsQuery);
      return clientsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching clients data:', error);
      return [];
    }
  };

  const fetchClients = async (agentName) => {
    try {
      const clientsQuery = query(collection(db, 'Clients'), where('assigned_agent_id', '==', agentName));
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsList = clientsSnapshot.docs.map(doc => doc.data());
      setClientList(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleDateChange = (date) => {
    setDate(date);
    filterAppointmentsByDate(date, appointments);
  };

  const filterAppointmentsByDate = (date, appointmentsList) => {
    const filteredAppointments = appointmentsList.filter(appointment => {
      const appointmentDate = appointment.scheduled_date.toDate();
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
    setSelectedDateAppointments(filteredAppointments);
  };

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
  };

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value);
  };

  const handleAddAppointment = async () => {
    if (!selectedClient || !startTime || !endTime) {
      alert('Please select a client and provide start and end times.');
      return;
    }

    try {
      const newAppointment = {
        agent_id: agentData.displayName,
        client_id: selectedClient,
        created_at: Timestamp.now(),
        scheduled_date: Timestamp.fromDate(date),
        start_time: startTime,
        end_time: endTime,
        status: 'proposed',
        updated_at: Timestamp.now(),
        initiated_by: 'agent'  // Track who initiated the appointment
      };

      await addDoc(collection(db, 'Visits'), newAppointment);
      fetchAppointments(agentData.displayName);
      setShowPopup(false);
      alert('Appointment proposed successfully.');
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Failed to propose appointment.');
    }
  };

  const handleConfirmAppointment = async (id) => {
    try {
      const appointmentRef = doc(db, 'Visits', id);
      await updateDoc(appointmentRef, {
        status: 'confirmed',
        updated_at: Timestamp.now(),
      });
      fetchAppointments(agentData.displayName);
      alert('Appointment confirmed successfully.');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment.');
    }
  };

  const handleRejectAppointment = async (id) => {
    try {
      const appointmentRef = doc(db, 'Visits', id);
      await updateDoc(appointmentRef, {
        status: 'rejected',
        updated_at: Timestamp.now(),
      });
      fetchAppointments(agentData.displayName);
      alert('Appointment rejected successfully.');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Failed to reject appointment.');
    }
  };

  const handleProposeNewTime = (id) => {
    // Implement the logic to propose a new time
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await deleteDoc(doc(db, 'Visits', id));
      fetchAppointments(agentData.displayName);
      alert('Appointment deleted successfully.');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment.');
    }
  };

  const handleDoneAppointment = async (id) => {
    try {
      const appointmentRef = doc(db, 'Visits', id);
      await updateDoc(appointmentRef, {
        status: 'visited',
        updated_at: Timestamp.now(),
      });
      fetchAppointments(agentData.displayName);
      alert('Appointment marked as done.');
    } catch (error) {
      console.error('Error marking appointment as done:', error);
      alert('Failed to mark appointment as done.');
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasAppointment = appointments.some(appointment => {
        const appointmentDate = appointment.scheduled_date.toDate();
        return (
          appointmentDate.getDate() === date.getDate() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getFullYear() === date.getFullYear()
        );
      });
      return hasAppointment ? <div className="highlight"></div> : null;
    }
  };

  return (
    <div className="visit-schedule">
      <div className="back-button-containe-VS">
        <button className="back-button-component" onClick={() => navigate(-1)}>
          <FaArrowLeft className="back-icon-component" /> Back
        </button>
      </div>
      <h2 className="visit-schedule-title">Visit Schedule</h2>
      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange}
          value={date}
          tileContent={tileContent}
        />
      </div>
      <button className="add-appointment-button" onClick={() => setShowPopup(true)}>+</button>
      <h3 className="appointments-title">Appointments on {date.toDateString()}</h3>
      <div className="appointments-list">
        {selectedDateAppointments.map((appointment) => (
          <div key={appointment.id} className="appointment-item">
            <div className="appointment-info">
              <p><strong>{appointment.client_full_name}</strong></p>
              <p>{appointment.scheduled_date.toDate().toLocaleString()}</p>
              <p>{appointment.start_time} - {appointment.end_time}</p>
              <p className={`appointment-status-visit ${appointment.status === 'proposed' ? 'proposed' : appointment.status === 'confirmed' ? 'confirmed' : appointment.status === 'waiting for agent confirm' ? 'waiting-for-agent-confirm' : appointment.status === 'rejected' ? 'rejected' : ''}`}>
  {appointment.status}
</p>
            </div>
            {appointment.status === 'proposed' && appointment.initiated_by === 'client' && (
              <>
                <button className="confirm-button" onClick={() => handleConfirmAppointment(appointment.id)}>Confirm</button>
                <button className="reject-button-visit" onClick={() => handleRejectAppointment(appointment.id)}>Reject</button>
                {/* <button className="propose-new-time-button" onClick={() => handleProposeNewTime(appointment.id)}>Propose New Time</button> */}
              </>
            )}
            {appointment.status === 'proposed' && appointment.initiated_by !== 'client' && (
              <>
                <p className="waiting-message" ></p>
                <button className="delete-button-visit" onClick={() => handleDeleteAppointment(appointment.id)}>Delete</button>
              </>
            )}
            {appointment.status === 'confirmed' && (
              <>
                <button className="done-button" onClick={() => handleDoneAppointment(appointment.id)}>Done</button>
                <button className="delete-button-visit" onClick={() => handleDeleteAppointment(appointment.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Add Appointment</h3>
            <select className="styled-select" value={selectedClient} onChange={handleClientChange}>
              <option value="">Select a client</option>
              {clientList.map((client) => (
                <option className="client-option-list" key={client.client_id} value={client.client_id}>
                  {client.full_name}
                </option>
              ))}
            </select>
            <input className="start-time-input"
              type="time"
              value={startTime}
              onChange={handleStartTimeChange}
              placeholder="Start Time"
            />
            <input className="end-time-input"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              placeholder="End Time"
            />
            <div className="buttons-container">
              
              <button className = "add-button-cancel-visit" onClick={() => setShowPopup(false)}>Cancel</button>
              <button onClick={handleAddAppointment}>Add Appointment</button>
            </div>
          </div>
        </div>
      )}
      <BottomBar />
    </div>
  );
};

export default VisitSchedule;
