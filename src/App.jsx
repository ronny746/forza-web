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
import ExpenseFinance from './pages/ExpenseFinance';
import Profile from './pages/Profile';

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
      <Route path="/visit" element={<W><Visit /></W>} />
      <Route path="/leave_management" element={<W><LeaveManagement /></W>} />
      <Route path="/misspunch" element={<W><MissPunchRequests /></W>} />
      <Route path="/attendence" element={<W><Attendance /></W>} />
      <Route path="/report" element={<W><AttendanceReport /></W>} />
      <Route path="/profile" element={<W><Profile /></W>} />

      {/* Admin */}
      <Route path="/user" element={<W><UserManagement /></W>} />
      <Route path="/register" element={<W><Register /></W>} />
      <Route path="/user_configuration" element={<W><UserConfiguration /></W>} />
      <Route path="/expense_claim" element={<W><ExpenseClaim /></W>} />
      <Route path="/expense" element={<W><ExpenseManagement /></W>} />

      {/* HR Expense — single unified page, filter via dropdown inside */}
      <Route path="/expense_hr" element={<W><ExpenseHR /></W>} />
      <Route path="/expense_reports" element={<W><SettlementReports /></W>} />
      <Route path="/expense_payments" element={<W><ExpensePaymentHistory /></W>} />
      <Route path="/expense_finance" element={<W><ExpenseFinance /></W>} />

      <Route path="/pending_approves" element={<Navigate to="/expense_hr" />} />
      <Route path="/released_approves" element={<Navigate to="/expense_hr" />} />
      <Route path="/hold" element={<Navigate to="/expense_hr" />} />
      <Route path="/expense-hr" element={<Navigate to="/expense_hr" />} />
      <Route path="/expense-hr/*" element={<Navigate to="/expense_hr" />} />

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
