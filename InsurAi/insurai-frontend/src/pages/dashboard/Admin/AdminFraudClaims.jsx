// src/components/admin/AdminFraudClaims.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminFraudClaims() {
  const [fraudClaims, setFraudClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewingClaim, setViewingClaim] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch fraud claims
  useEffect(() => {
    const fetchFraudClaims = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return console.error("❌ No admin token found!");

        const response = await axios.get("http://localhost:8080/admin/claims/fraud", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFraudClaims(response.data);
      } catch (error) {
        console.error("Error fetching fraud claims:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFraudClaims();
  }, []);

  // Filter + search
  const filteredClaims = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return fraudClaims.filter((claim) => {
      const matchesSearch =
        claim.employeeName?.toLowerCase().includes(query) ||
        claim.policyName?.toLowerCase().includes(query) ||
        claim.fraudReason?.toLowerCase().includes(query) ||
        claim.assignedHrName?.toLowerCase().includes(query) ||
        claim.title?.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Pending"
          ? claim.status === "Pending"
          : claim.status !== "Pending";
      return matchesSearch && matchesStatus;
    });
  }, [fraudClaims, searchTerm, statusFilter]);

  // Sorting
  const sortedClaims = useMemo(() => {
    if (!sortConfig.key) return filteredClaims;
    return [...filteredClaims].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "amount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortConfig.key === "claimDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredClaims, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  // Statistics
  const stats = useMemo(() => {
    const total = fraudClaims.length;
    const pending = fraudClaims.filter((c) => c.status === "Pending").length;
    const resolved = total - pending;
    const totalAmount = fraudClaims.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const pendingAmount = fraudClaims
      .filter((c) => c.status === "Pending")
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const resolvedAmount = totalAmount - pendingAmount;
    return { total, pending, resolved, totalAmount, pendingAmount, resolvedAmount };
  }, [fraudClaims]);

  // Charts
  const monthlyData = useMemo(() => {
    const monthMap = {};
    fraudClaims.forEach((c) => {
      const month = new Date(c.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      monthMap[month] += parseFloat(c.amount) || 0;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        { label: "Total Fraud Amount", data: Object.values(monthMap), backgroundColor: "#0d6efd" },
      ],
    };
  }, [fraudClaims]);

  const statusPieData = useMemo(
    () => ({
      labels: ["Pending", "Resolved"],
      datasets: [{ data: [stats.pending, stats.resolved], backgroundColor: ["#ffc107", "#198754"] }],
    }),
    [stats]
  );

  const lineData = useMemo(() => {
    const monthMap = {};
    fraudClaims.forEach((c) => {
      const month = new Date(c.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      if (c.status !== "Pending") monthMap[month] += parseFloat(c.amount) || 0;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        {
          label: "Amount Saved",
          data: Object.values(monthMap),
          borderColor: "#198754",
          backgroundColor: "#19875433",
          fill: true,
        },
      ],
    };
  }, [fraudClaims]);

  // PDF export
  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Type", "Employee", "HR", "Claim Date", "Amount", "Status", "Fraud Reason"];
    const tableRows = sortedClaims.map((c) => [
      c.id,
      c.title,
      c.employeeName || `#${c.employeeId}`,
      c.assignedHrName || `HR #${c.assignedHrId}`,
      c.claimDate?.split("T")[0],
      formatCurrency(c.amount),
      c.status,
      c.fraudReason,
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save("admin_fraud_claims.pdf");
  };

  if (loading) return <div>Loading fraud claims...</div>;

  return (
    <div className="container-fluid">
      <h4 className="fw-bold mb-2">Admin Fraud Dashboard</h4>

      {/* Statistics Cards */}
      <div className="row mb-4">
        {[
          { label: "Total Alerts", value: stats.total, color: "primary" },
          { label: "Pending", value: stats.pending, color: "warning" },
          { label: "Resolved", value: stats.resolved, color: "success" },
          { label: "Total Amount", value: stats.totalAmount, color: "info" },
          { label: "Pending Amount", value: stats.pendingAmount, color: "secondary" },
          { label: "Amount Saved", value: stats.resolvedAmount, color: "success" },
        ].map((s, i) => (
          <div key={i} className="col-md-2 col-6 mb-2">
            <div className={`card bg-${s.color} bg-opacity-10 border-0 shadow-sm text-center`}>
              <div className="card-body">
                <h5 className={`text-${s.color}`}>
                  {s.label.includes("Amount") ? formatCurrency(s.value) : s.value}
                </h5>
                <small>{s.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">Monthly Fraud Amount</div>
            <div className="card-body">
              <Bar data={monthlyData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-warning text-dark">Status Distribution</div>
            <div className="card-body">
              <Pie data={statusPieData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white">Amount Saved Over Time</div>
            <div className="card-body">
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by employee, policy, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-2 mb-2">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="col-md-6 d-flex gap-2 mb-2">
          <CSVLink data={sortedClaims} filename="admin_fraud_claims.csv" className="btn btn-success btn-sm">
            Export CSV
          </CSVLink>
          <button className="btn btn-danger btn-sm" onClick={exportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white">Fraud Claims</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("id")} className="cursor-pointer">ID</th>
                  <th onClick={() => handleSort("title")} className="cursor-pointer">Type</th>
                  <th onClick={() => handleSort("employeeName")} className="cursor-pointer">Employee</th>
                  <th onClick={() => handleSort("assignedHrName")} className="cursor-pointer">Assigned HR</th>
                  <th onClick={() => handleSort("claimDate")} className="cursor-pointer">Claim Date</th>
                  <th onClick={() => handleSort("amount")} className="cursor-pointer text-end">Amount</th>
                  <th>Status</th>
                  <th>Fraud Reason</th>
                </tr>
              </thead>
              <tbody>
                {sortedClaims.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No fraud claims found
                    </td>
                  </tr>
                ) : (
                  sortedClaims.map((c) => (
                    <tr key={c.id} onClick={() => setViewingClaim(c)} className="cursor-pointer">
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.employeeName || `#${c.employeeId}`}</td>
                      <td>{c.assignedHrName || `HR #${c.assignedHrId}`}</td>
                      <td>{c.claimDate?.split("T")[0]}</td>
                      <td className="text-end">{formatCurrency(c.amount)}</td>
                      <td>
                        <span className={`badge ${
                          c.status === "Pending" ? "bg-warning" : c.status === "Approved" ? "bg-success" : "bg-danger"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-danger fw-semibold">{c.fraudReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {viewingClaim && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title">Fraud Claim #{viewingClaim.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingClaim(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Employee:</strong> {viewingClaim.employeeName || `#${viewingClaim.employeeId}`}</p>
                    <p><strong>Assigned HR:</strong> {viewingClaim.assignedHrName || `HR #${viewingClaim.assignedHrId}`}</p>
                    <p><strong>Type:</strong> {viewingClaim.title}</p>
                    <p><strong>Policy:</strong> {viewingClaim.policyName}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Claim Date:</strong> {viewingClaim.claimDate?.split("T")[0]}</p>
                    <p><strong>Amount:</strong> {formatCurrency(viewingClaim.amount)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        viewingClaim.status === "Pending" ? "bg-warning" :
                        viewingClaim.status === "Approved" ? "bg-success" : "bg-danger"
                      }`}>{viewingClaim.status}</span>
                    </p>
                    <p><strong>Fraud Flag:</strong> 
                      {viewingClaim.fraudFlag ? <span className="badge bg-danger ms-2">Yes</span> : <span className="badge bg-success ms-2">No</span>}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <p><strong>Fraud Reasons:</strong></p>
                  <ul>
                    {viewingClaim.fraudReason?.split(";").map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}
                  </ul>
                </div>
                {viewingClaim.documents?.length > 0 && (
                  <div>
                    <p><strong>Attached Documents:</strong></p>
                    <ul>
                      {viewingClaim.documents.map((doc, i) => (
                        <li key={i}>
                          <a href={`http://localhost:8080${doc}`} target="_blank" rel="noopener noreferrer">Document {i + 1}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewingClaim(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .table-hover tbody tr:hover { background-color: rgba(0,123,255,0.05); }
      `}</style>
    </div>
  );
}
