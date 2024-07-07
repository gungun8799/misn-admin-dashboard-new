import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/misn-logo-Photoroom.png';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="logo">
        <img src={logo} alt="MiSN Logo" className="misn-logo" />
      </div>
      <ul>
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard" className="sidebar-link">Dashboard</Link>
        </li>

        <li className={location.pathname === '/client-information' ? 'active' : ''}>
          <Link to="/client-information" className="sidebar-link">Client Information</Link>
        </li>
        <li className={location.pathname === '/AgentInformation' ? 'active' : ''}>
          <Link to="/AgentInformation" className="sidebar-link">Agent Information</Link>
        </li>
        <li className={location.pathname === '/Form' ? 'active' : ''}>
          <Link to="/Form" className="sidebar-link">Question sets & Form upload</Link>
        </li>
        <li className={location.pathname === '/NewsUpdatePage' ? 'active' : ''}>
          <Link to="/NewsUpdatePage" className="sidebar-link">News and information</Link>
        </li>
        <li className={location.pathname === '/services-update' ? 'active' : ''}>
          <Link to="/services-update" className="sidebar-link">Services update</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
