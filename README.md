**Client app repository : https://github.com/gungun8799/misn-client-app
**Agent app repository : https://github.com/gungun8799/misn-agent-app




# Maternal Infant Service (MiSN) Web Application

This repository contains the web applications for the Maternal Infant Service New York (MiSN) project. MiSN is a non-profit social support organization aimed at streamlining operations by leveraging AI for tasks such as eligibility screening, form filling, service matching, and client communication. The project includes three interconnected applications: Admin Dashboard, Client App, and Agent App.

## Table of Contents

- [Project Overview](#project-overview)
- [Applications](#applications)
  - [Admin Dashboard](#admin-dashboard)
  - [Client App](#client-app)
  - [Agent App](#agent-app)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The MiSN project aims to provide a seamless experience for both clients and agents, ensuring that underserved citizens receive the necessary support by matching them to state-provided facilities and services efficiently. The system is designed to handle various operations including service requests, document uploads, appointment scheduling, and communication between clients and agents.

## Applications

### Admin Dashboard

The Admin Dashboard allows administrators to monitor and manage the operations of MiSN. Features include:
- User management
- Service and program management
- Monitoring application statuses
- Generating reports

### Client App

The Client App is designed for clients to interact with MiSN services. Features include:
- Service request submission
- Document upload
- Viewing service status
- Scheduling appointments
- Communicating with agents

### Agent App

The Agent App is for agents to manage their assigned clients. Features include:
- Viewing and managing client requests
- Communicating with clients
- Scheduling and confirming visits
- Submitting service details

## Installation

To run these applications locally, follow these steps for each application:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/misn-project.git
   cd misn-project
   ```

2. **Navigate to each application directory and install dependencies:**

   - Admin Dashboard:
     ```bash
     cd admin-dashboard
     npm install
     ```

   - Client App:
     ```bash
     cd client-app
     npm install
     ```

   - Agent App:
     ```bash
     cd agent-app
     npm install
     ```

## Usage

To start each application, navigate to the respective directory and run:

- Admin Dashboard:
  ```bash
  cd admin-dashboard
  npm start
  ```

- Client App:
  ```bash
  cd client-app
  npm start
  ```

- Agent App:
  ```bash
  cd agent-app
  npm start
  ```

Each application will start on its default port (usually `http://localhost:3000`).

## Technologies

The MiSN project uses the following technologies:
- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Firebase Firestore, Firebase Storage
- **Authentication:** Firebase Authentication

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure your code follows the project's coding standards and conventions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.



This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
