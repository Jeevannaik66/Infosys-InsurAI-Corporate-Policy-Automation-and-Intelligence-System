# InsurAI – Corporate Insurance Management System

## Project Overview
InsurAI is a **corporate-level insurance management platform** designed to streamline and automate insurance policy workflows. It integrates **automation, AI analytics, and real-time notifications** to manage corporate insurance policies, claims, and employee support efficiently.  

The system ensures transparency, fraud detection, and scalability while providing role-based access for Employees, Agents, HR, and Admin.

---

## Technology Stack

**Frontend:** React.js  
**Backend:** Java Spring Boot  
**Database:** MySQL  
**Authentication:** JWT  
**Automation:** Spring Scheduler / Quartz  
**AI/Analytics:** Rule-based fraud detection, predictive insights for HR/Admin  
**Notifications & Support:** Email/SMS alerts, chatbot for employee queries  
**Deployment (future):** Docker + Cloud (AWS/Azure)  

---

## System Users & Roles

### Employee
- Register/Login
- View policies & benefits
- Submit claims with supporting documents
- Track claim status
- Contact agents via queries or chatbot

### Agent
- Respond to employee queries
- Update availability
- Track pending queries

### HR
- Approve/Reject claims
- Access claim details and supporting documents
- Employee management
- Generate reports (CSV/PDF)
- View AI-based fraud alerts

### Admin
- Manage roles & permissions
- Create/Edit/Delete policies
- Monitor fraud alerts
- Configure notifications

---

## Key Features

- **Role-based access** for Employee, Agent, HR, and Admin  
- **Policy Management**: Admin adds policies; visible to all employees  
- **Claim Management**: Employees submit, edit, and track claims  
- **Employee Support**: Chatbot and Agent query system  
- **Automated Notifications**: Email/SMS for claim status updates  
- **Fraud Detection**: Detects duplicate or suspicious claims  
- **Reports & Analytics**: Dashboard charts, export CSV/PDF  

---

## Project Workflow

1. **Admin** adds and manages corporate policies.  
2. Policies are visible to **all employees**; uniform across the company.  
3. **Employees** submit claims against policies.  
4. Claims are automatically linked to **assigned HR**.  
5. **HR** approves/rejects claims.  
6. **Agents** respond to employee queries.  
7. Automated **reports** generated for HR/Admin/Agent.  
8. **Notifications** sent to employees for claim status updates.  

---

## Folder Structure

```

insurai-backend/
├─ src/main/java/com/insurai/insurai_backend
│  ├─ config/          # Security & JWT config
│  ├─ controller/      # API endpoints
│  ├─ model/           # Entity classes
│  ├─ repository/      # Database access
│  ├─ service/         # Business logic
│  └─ InsuraiBackendApplication.java
└─ src/main/resources
├─ application.properties
├─ static/
└─ templates/

insurai-frontend/
├─ src/pages/           # React pages for Employee, HR, Agent, Admin
├─ src/assets/          # Images, CSS
├─ src/api.js           # API requests
├─ src/App.jsx          # Main React app
└─ vite.config.js

```

---

## Setup & Installation

### Backend
1. Install **Java 21**, **Maven**, and **MySQL**.
2. Clone the repository and navigate to `insurai-backend`.
3. Configure `application.properties` with your MySQL credentials.
4. Run `mvn spring-boot:run` to start the backend server.

### Frontend
1. Install **Node.js** and **npm**.
2. Navigate to `insurai-frontend`.
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to start the frontend server.

---

## Key Learnings

- Full-stack development with **React.js** and **Spring Boot**  
- Role-based authentication and **JWT security**  
- Database management using **MySQL**  
- Implementing **automation** with Spring Scheduler  
- Rule-based **fraud detection** and notifications system  
- Handling file storage and integrations with **Supabase / S3**  

---

## Future Scope

- Mobile applications (Android/iOS) for employees  
- Advanced AI/ML-based fraud detection  
- Integration with insurance providers and hospitals  
- Cloud deployment for large-scale usage  
- Blockchain for secure claim history  

---


---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


