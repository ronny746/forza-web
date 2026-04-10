import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Visit from './pages/Visit';
import UserManagement from './pages/UserManagement';
import Register from './pages/Register';
import UserConfiguration from './pages/UserConfiguration';
import LeaveManagement from './pages/LeaveManagement';
import ExpenseClaim from './pages/ExpenseClaim';
import MissPunchRequests from './pages/MissPunchRequests';
import ExpenseHR from './pages/ExpenseHR';
import ExpenseManagement from './pages/ExpenseManagement';
import SettlementReports from './pages/SettlementReports';
import ExpensePaymentHistory from './pages/ExpensePaymentHistory';
import Attendance from './pages/Attendance';
import AttendanceReport from './pages/AttendanceReport';
import Profile from './pages/Profile';
import VisitApproval from './pages/Visit/VisitApproval';
import FullExpenseReport from './pages/FullExpenseReport';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/dashboard" />;
};

const W = ({ children }) => (
  <PrivateRoute><Layout>{children}</Layout></PrivateRoute>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Main */}
      <Route path="/dashboard" element={<W><Dashboard /></W>} />
      <Route path="/visits" element={<W><Visit /></W>} />
      <Route path="/visit-approval" element={<W><VisitApproval /></W>} />
      <Route path="/correction-requests" element={<W><MissPunchRequests /></W>} />
      <Route path="/attendance" element={<W><Attendance /></W>} />
      <Route path="/reports" element={<W><AttendanceReport /></W>} />
      <Route path="/profile" element={<W><Profile /></W>} />

      {/* Admin */}
      <Route path="/users" element={<W><UserManagement /></W>} />
      <Route path="/registration" element={<W><Register /></W>} />
      <Route path="/settings" element={<W><UserConfiguration /></W>} />
      <Route path="/my-expenses" element={<W><ExpenseManagement /></W>} />

      {/* HR Expense */}
      <Route path="/hr-expenses" element={<W><ExpenseHR /></W>} />
      <Route path="/settlements" element={<W><SettlementReports /></W>} />
      <Route path="/payments" element={<W><ExpensePaymentHistory /></W>} />
      <Route path="/full-reports" element={<W><FullExpenseReport /></W>} />

      {/* Legacy Redirects */}
      <Route path="/visit" element={<Navigate to="/visits" />} />
      <Route path="/report" element={<Navigate to="/reports" />} />
      <Route path="/misspunch" element={<Navigate to="/correction-requests" />} />
      <Route path="/user" element={<Navigate to="/users" />} />
      <Route path="/register" element={<Navigate to="/registration" />} />
      <Route path="/user_configuration" element={<Navigate to="/settings" />} />
      <Route path="/expense" element={<Navigate to="/my-expenses" />} />
      <Route path="/expense_hr" element={<Navigate to="/hr-expenses" />} />
      <Route path="/expense_reports" element={<Navigate to="/settlements" />} />
      <Route path="/expense_payments" element={<Navigate to="/payments" />} />
      <Route path="/attendence" element={<Navigate to="/attendance" />} />

      <Route path="/pending_approves" element={<Navigate to="/hr-expenses" />} />
      <Route path="/released_approves" element={<Navigate to="/hr-expenses" />} />
      <Route path="/hold" element={<Navigate to="/hr-expenses" />} />
      <Route path="/expense-hr/*" element={<Navigate to="/hr-expenses" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-primary-100 dark:border-primary-900/30" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            </div>
          </div>
        }>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
