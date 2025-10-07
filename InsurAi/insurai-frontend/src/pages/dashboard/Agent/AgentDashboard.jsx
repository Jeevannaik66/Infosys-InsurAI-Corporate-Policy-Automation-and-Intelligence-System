import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Dashboard.css";
import axios from "axios";
import AgentQueries from "./AgentQueries";
import AgentClaims from "./AgentClaims";
import AgentAvailability from "./AgentAvailability";
import AgentReports from "./AgentReports"; // adjust path if needed

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const [availability, setAvailability] = useState(false);
  const [employeeQueries, setEmployeeQueries] = useState([]);
  const [assistedClaims, setAssistedClaims] = useState([]);

  const [futureFrom, setFutureFrom] = useState("");
  const [futureTo, setFutureTo] = useState("");
  const [agentId, setAgentId] = useState(null);
  const [agentName, setAgentName] = useState("");

  // -------------------- Get agent info, availability, and queries --------------------
  useEffect(() => {
    const storedAgentId = localStorage.getItem("agentId");
    const storedAgentName = localStorage.getItem("agentName");
    const token = localStorage.getItem("token");

    if (!token) {
      alert("No token found, please login again");
      navigate("/agent/login");
      return;
    }

    if (storedAgentId && storedAgentName) {
      const id = parseInt(storedAgentId);
      setAgentId(id);
      setAgentName(storedAgentName);

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch availability
      axios.get(`http://localhost:8080/agent/${id}/availability`, axiosConfig)
        .then(res => {
          if (res.data && typeof res.data.available === "boolean") {
            setAvailability(res.data.available);
          }
        })
        .catch(err => console.error("Failed to fetch availability", err));

      // -------------------- Fetch all employees once --------------------
      let employeeMap = {};
      axios.get("http://localhost:8080/auth/employees", axiosConfig)
        .then(empRes => {
          empRes.data.forEach(emp => {
            employeeMap[emp.id] = emp.name;
          });

          // -------------------- Fetch all queries --------------------
          axios.get(`http://localhost:8080/agent/queries/all/${id}`, axiosConfig)
            .then(res => {
              if (res.data) {
                const allQueries = res.data.map(q => ({
                  id: q.id,
                  employeeId: q.employeeId,
                  employee: q.employee ? q.employee.name : employeeMap[q.employeeId] || `Employee ${q.employeeId}`,
                  query: q.queryText,
                  policyName: q.policyName || "-",
                  claimType: q.claimType || "-",
                  createdAt: q.createdAt,
                  updatedAt: q.updatedAt,
                  status: q.status === "resolved" ? "Resolved" : "Pending",
                  response: q.response || "",
                  agentId: q.agentId,
                  allowEdit: q.status === "pending"
                }));

                setEmployeeQueries(allQueries);

                // -------------------- Derive assisted claims automatically --------------------
                const resolvedClaims = allQueries
                  .filter(q => q.status === "Resolved")
                  .map(q => ({
                    id: q.id,
                    employee: q.employee,
                    type: q.claimType || "-",
                    policyName: q.policyName || "-", // Display policy name instead of amount
                    date: q.updatedAt ? new Date(q.updatedAt).toLocaleString() : "-",
                    status: "Approved" // Default; adjust if needed
                  }));

                setAssistedClaims(resolvedClaims);
              }
            })
            .catch(err => console.error("Failed to fetch queries", err));
        })
        .catch(err => console.error("Failed to fetch employees", err));
    } else {
      navigate("/agent/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/agent/login");
  };

  // -------------------- Toggle availability --------------------
  const toggleAvailability = async () => {
    try {
      const newStatus = !availability;
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post("http://localhost:8080/agent/availability", {
        agentId,
        available: newStatus,
        startTime: new Date().toISOString(),
        endTime: null
      }, axiosConfig);

      const res = await axios.get(`http://localhost:8080/agent/${agentId}/availability`, axiosConfig);
      if (res.data) setAvailability(res.data.available);

      alert(`You are now ${newStatus ? "available" : "unavailable"} for queries`);
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability");
    }
  };

  // -------------------- Schedule future availability --------------------
  const scheduleFutureAvailability = async () => {
    if (!futureFrom || !futureTo) {
      alert("Please select both start and end time.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      const startISO = new Date(futureFrom).toISOString();
      const endISO = new Date(futureTo).toISOString();

      await axios.post("http://localhost:8080/agent/availability", {
        agentId,
        available: true,
        startTime: startISO,
        endTime: endISO
      }, axiosConfig);

      const res = await axios.get(`http://localhost:8080/agent/${agentId}/availability`, axiosConfig);
      if (res.data) setAvailability(res.data.available);

      alert("Future availability scheduled successfully!");
      setFutureFrom("");
      setFutureTo("");
    } catch (error) {
      console.error("Error scheduling availability:", error);
      alert("Failed to schedule availability.");
    }
  };

  // -------------------- Respond to a query --------------------
  const respondToQuery = async (id, responseText, isUpdate = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const query = employeeQueries.find(q => q.id === id);
      if (!query) return alert("Query not found");

      await axios.put(
        `http://localhost:8080/agent/queries/respond/${id}`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmployeeQueries(prev =>
        prev.map(q =>
          q.id === id
            ? {
                ...q,
                response: responseText,
                status: isUpdate ? q.status : "Resolved",
                allowEdit: isUpdate ? true : true
              }
            : q
        )
      );

      alert(isUpdate ? "Response updated successfully!" : "Response sent successfully!");
    } catch (error) {
      console.error("Failed to send/update response:", error.response?.data || error.message);
      alert("Failed to send/update response");
    }
  };

  // -------------------- Handle response input changes --------------------
  const handleResponseChange = (id, value) => {
    setEmployeeQueries(prev =>
      prev.map(q => q.id === id ? { ...q, response: value } : q)
    );
  };


  
  // -------------------- Render content based on active tab --------------------
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        // Correctly count pending queries
        const pendingQueries = employeeQueries.filter(
          q => q.status === "Pending" || !q.response || q.response.trim() === ""
        );

        // Average response time (simulated)
        const avgResponseTime = employeeQueries.length > 0
          ? (employeeQueries.reduce((acc, q) => {
              if (q.updatedAt && q.createdAt) {
                return acc + (new Date(q.updatedAt) - new Date(q.createdAt));
              }
              return acc;
            }, 0) / employeeQueries.length) / (1000 * 60 * 60) // in hours
          : 0;

        // Satisfaction rate (simulated)
        const satisfactionRate = employeeQueries.length > 0
          ? Math.round(
              (employeeQueries.filter(q => q.status === "Resolved").length /
                employeeQueries.length) *
                100
            )
          : 0;

        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Agent Dashboard Overview</h4>
              <div className="d-flex align-items-center">
                <span className={`badge ${availability ? "bg-success" : "bg-warning"} me-2`}>
                  {availability ? "Available" : "Unavailable"}
                </span>
                <button
                  className={`btn btn-sm ${availability ? "btn-warning" : "btn-success"}`}
                  onClick={toggleAvailability}
                >
                  {availability ? "Set Unavailable" : "Set Available"}
                </button>
              </div>
            </div>

            <div className="row mb-4">
              {/* Pending Queries */}
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm border-left-primary">
                  <div className="card-body">
                    <h5 className="card-title">Pending Queries</h5>
                    <h2 className="card-text">{pendingQueries.length}</h2>
                    <p><i className="bi bi-exclamation-circle-fill text-warning"></i> Require your attention</p>
                  </div>
                </div>
              </div>

              {/* Assisted Claims */}
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm border-left-success">
                  <div className="card-body">
                    <h5 className="card-title">Assisted Claims</h5>
                    <h2 className="card-text">{assistedClaims.length}</h2>
                    <p><i className="bi bi-check-circle-fill text-success"></i> Completed</p>
                  </div>
                </div>
              </div>

              {/* Average Response Time */}
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm border-left-info">
                  <div className="card-body">
                    <h5 className="card-title">Avg. Response Time</h5>
                    <h2 className="card-text">{avgResponseTime.toFixed(1)}h</h2>
                    <p><i className="bi bi-clock-fill text-info"></i> Faster than average</p>
                  </div>
                </div>
              </div>

              {/* Satisfaction Rate */}
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm border-left-warning">
                  <div className="card-body">
                    <h5 className="card-title">Satisfaction Rate</h5>
                    <h2 className="card-text">{satisfactionRate}%</h2>
                    <p><i className="bi bi-star-fill text-warning"></i> Employee feedback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Queries and Claims */}
            <div className="row">
              {/* Recent Employee Queries */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Recent Employee Queries</h5>
                  </div>
                  <div className="card-body">
                    {employeeQueries.slice(0, 5).map((query) => {
                      const isAnswered = query.response && query.response.trim() !== "";
                      return (
                        <div key={query.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div>
                            <h6 className="mb-0">{query.employee}</h6>
                            <small className="text-muted">{query.query}</small>
                          </div>
                          <span className={`badge ${isAnswered ? 'bg-success' : 'bg-warning'}`}>
                            {isAnswered ? 'Answered' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                    {employeeQueries.length === 0 && (
                      <p className="text-muted text-center py-3">No queries assigned yet</p>
                    )}
                    <button className="btn btn-outline-primary mt-3 btn-sm" onClick={() => setActiveTab("queries")}>
                      View All Queries
                    </button>
                  </div>
                </div>
              </div>

              {/* Recently Assisted Claims */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Recently Assisted Claims</h5>
                  </div>
                  <div className="card-body">
                    {assistedClaims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="border-bottom py-2">
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-0">{claim.employee}</h6>
                          <span className={`badge ${claim.status === 'Approved' ? 'bg-success' : 'bg-warning'}`}>
                            {claim.status}
                          </span>
                        </div>
                        <small className="text-muted">{claim.type} • {claim.policyName} • {claim.date}</small>
                      </div>
                    ))}
                    {assistedClaims.length === 0 && (
                      <p className="text-muted text-center py-3">No claims assisted yet</p>
                    )}
                    <button className="btn btn-outline-success mt-3 btn-sm" onClick={() => setActiveTab("claims")}>
                      View All Claims
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

 

 case "queries":
  return (
    <AgentQueries
      availability={availability}
      filter={filter}
      setFilter={setFilter}
      employeeQueries={employeeQueries}
      handleResponseChange={handleResponseChange}
      respondToQuery={respondToQuery}
      axios={axios}
      setEmployeeQueries={setEmployeeQueries}
    />
  );

case "claims":
  return <AgentClaims assistedClaims={assistedClaims} />;

 case "availability":
  return (
    <AgentAvailability
      agentName={agentName}
      availability={availability}
      toggleAvailability={toggleAvailability}
      futureFrom={futureFrom}
      setFutureFrom={setFutureFrom}
      futureTo={futureTo}
      setFutureTo={setFutureTo}
      scheduleFutureAvailability={scheduleFutureAvailability}
    />
  );


      
      case "resources":
        return (
          <div>
            <h4 className="mb-4">Policy Resources</h4>
            
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-file-earmark-text fs-1 text-primary mb-3"></i>
                    <h5>Health Policy Guide</h5>
                    <p>Complete documentation for health insurance policies</p>
                    <button className="btn btn-outline-primary">View Guide</button>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-file-earmark-pdf fs-1 text-danger mb-3"></i>
                    <h5>Claim Process FAQ</h5>
                    <p>Frequently asked questions about the claim process</p>
                    <button className="btn btn-outline-danger">Download PDF</button>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-play-btn fs-1 text-info mb-3"></i>
                    <h5>Training Videos</h5>
                    <p>Video tutorials for assisting employees</p>
                    <button className="btn btn-outline-info">Watch Videos</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card mt-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Quick Reference Materials</h5>
              </div>
              <div className="card-body">
                <div className="list-group">
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">Contact Information for Insurance Providers</h6>
                      <small className="text-muted">PDF</small>
                    </div>
                    <small className="text-muted">Updated 2 days ago</small>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">Claim Submission Checklist</h6>
                      <small className="text-muted">DOCX</small>
                    </div>
                    <small className="text-muted">Updated 1 week ago</small>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">Common Rejection Reasons & Solutions</h6>
                      <small className="text-muted">PDF</small>
                    </div>
                    <small className="text-muted">Updated 3 weeks ago</small>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
        
    case "reports":
      return (
        <AgentReports
          assistedClaims={assistedClaims}
          employeeQueries={employeeQueries}
          agentData={{ agentId, agentName }}
        />
      );

      
      default:
        return <h4>Welcome, {localStorage.getItem("agentName") || "Agent"}</h4>;
    }
  };

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <header className="bg-success text-white py-3 px-4 d-flex justify-content-between align-items-center w-100">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-person-check fs-2"></i>
          <h2 className="mb-0">InsurAI Agent Portal</h2>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span>Welcome, <strong>{localStorage.getItem("agentName") || "Agent"}</strong></span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="nav flex-column p-3">
            <a
              href="#"
              className={`nav-link ${activeTab === "home" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}
            >
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </a>
            <a
              href="#"
              className={`nav-link ${activeTab === "queries" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("queries"); }}
            >
              <i className="bi bi-question-circle me-2"></i> Employee Queries
            </a>
            <a
              href="#"
              className={`nav-link ${activeTab === "claims" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("claims"); }}
            >
              <i className="bi bi-file-earmark-check me-2"></i> Assisted Claims
            </a>
            <a
              href="#"
              className={`nav-link ${activeTab === "availability" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("availability"); }}
            >
              <i className="bi bi-calendar-check me-2"></i> Availability
            </a>
            <a
              href="#"
              className={`nav-link ${activeTab === "resources" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("resources"); }}
            >
              <i className="bi bi-file-earmark-text me-2"></i> Resources
            </a>
            <a
              href="#"
              className={`nav-link ${activeTab === "reports" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("reports"); }}
            >
              <i className="bi bi-graph-up me-2"></i> Reports
            </a>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="dashboard-content">
          <div className="dashboard-content-wrapper p-4">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}