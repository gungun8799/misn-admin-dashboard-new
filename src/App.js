import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Signup from './components/Signup/Signup';
import VerifyEmail from './components/VerifyEmail/VerifyEmail';
import ClientInformation from './components/ClientInformation/ClientInformation';
import Form from './components/Form/Form';
import FormBuilding from './components/FormBuilding/FormBuilding';
import AgentInformation from './components/AgentInformation/AgentInformation';
import NewsUpdatePage from './components/NewsUpdatePage/NewsUpdatePage';
import DetailAgentInformation from './components/DetailAgentInformation/DetailAgentInformation';




// import ReportGeneration from './components/ReportGeneration/ReportGeneration';
// import AgentInformation from './components/AgentInformation/AgentInformation';
// import QuestionSetsFormUpload from './components/QuestionSetsFormUpload/QuestionSetsFormUpload';
// import NewsInformation from './components/NewsInformation/NewsInformation';
// import ServicesUpdate from './components/ServicesUpdate/ServicesUpdate';

import './transition.css';
import { useState } from 'react';

function App() {
  const [direction, setDirection] = useState('forward');

  return (
    <Router>
      <div className="app">
        <AnimatedRoutes direction={direction} setDirection={setDirection} />
      </div>
    </Router>
  );
}

const AnimatedRoutes = ({ direction, setDirection }) => {
  const location = useLocation();

  return (
    <TransitionGroup>
        
  
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/client-information" element={<ClientInformation />} />
          <Route path="/Form" element={<Form />} />
          <Route path="/FormBuilding/:program" element={<FormBuilding />} />
          <Route path="/FormBuilding/:program/:formIndex" element={<FormBuilding />} />
          <Route path="/AgentInformation" element={<AgentInformation />} />
          <Route path="/NewsUpdatePage" element={<NewsUpdatePage />} />
          <Route path="/DetailAgentInformation/:agentId" element={<DetailAgentInformation />} />

          {/* <Route path="/report-generation" element={<ReportGeneration />} />
          <Route path="/agent-information" element={<AgentInformation />} />
          <Route path="/question-sets-form-upload" element={<QuestionSetsFormUpload />} />
          <Route path="/news-information" element={<NewsInformation />} />
          <Route path="/services-update" element={<ServicesUpdate />} /> */}
        </Routes>
    </TransitionGroup>
  );
};

export default App;
