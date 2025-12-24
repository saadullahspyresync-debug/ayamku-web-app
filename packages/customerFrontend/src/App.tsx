// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Layout from "./components/Layout";
// // import Home from "./pages/Home";
// // import Menu from "./pages/Menu";
// import Contact from "./pages/Contact";
// import CartCheckout from "./pages/CartCheckout";
// import Login from "./pages/auth/Login";
// import SignUp from "./pages/auth/SignUp";
// import ForgotPassword from "./pages/auth/ForgotPassword";
// import ResetPassword from "./pages/auth/ResetPassword";
// import NotFound from "./pages/NotFound";
// import AboutUs from "./pages/AboutUs";
// import "./App.css";
// import "./config/amplify"; // Initialize Amplify
// import VerifyEmail from "./pages/auth/EmailVerification";
// import Home from "./pages/Home/Home";
// import Menu from "./pages/Menu/Menu";
// import Rewards from "./pages/Rewards";
// import PaymentSuccess from "./pages/PaymentSuccess";
// import PaymentFailure from "./pages/PaymentFailure";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <AuthProvider>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <Routes>
//             {/* Auth Routes - No Layout - Guest Only */}
//             <Route
//               path="/auth/login"
//               element={
//                 <ProtectedRoute requireAuth={false}>
//                   <Login />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/auth/signup"
//               element={
//                 <ProtectedRoute requireAuth={false}>
//                   <SignUp />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/auth/forgot-password"
//               element={
//                 <ProtectedRoute requireAuth={false}>
//                   <ForgotPassword />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="/auth/verify" element={<VerifyEmail />} />
//             {/* <Route 
//               path="/auth/reset-password" 
//               element={
//                 <ProtectedRoute requireAuth={false}>
//                   <ResetPassword />
//                 </ProtectedRoute>
//               } 
//             /> */}

//             {/* Main App Routes - With Layout - Public */}
//             <Route
//               path="/"
//               element={
//                 <Layout>
//                   <Home />
//                 </Layout>
//               }
//             />
//             <Route
//               path="/menu"
//               element={
//                 <Layout>
//                   <Menu />
//                 </Layout>
//               }
//             />
//             <Route
//               path="/contact"
//               element={
//                 <Layout>
//                   <Contact />
//                 </Layout>
//               }
//             />
//             <Route
//               path="/about"
//               element={
//                 <Layout>
//                   <AboutUs />
//                 </Layout>
//               }
//             />

//             <Route
//               path="/rewards"
//               element={
//                 <Layout>
//                   <Rewards />
//                 </Layout>
//               }
//             />
//             <Route
//               path="/payment-success"
//               element={
//                 <Layout>
//                   <PaymentSuccess />
//                 </Layout>
//               }
//             />
            
// <Route
//               path="/payment-failure"
//               element={
//                 <Layout>
//                   <PaymentFailure />
//                 </Layout>
//               }
//             />
//             {/* Protected Routes - Requires Authentication */}
//             <Route
//               path="/cart"
//               element={
//                 <ProtectedRoute requireAuth={true}>
//                   <Layout>
//                     <CartCheckout />
//                   </Layout>
//                 </ProtectedRoute>
//               }
//             />

//             {/* Catch-all routes */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       </TooltipProvider>
//     </AuthProvider>
//   </QueryClientProvider>
// );

// export default App;



import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Contact from "./pages/Contact";
import CartCheckout from "./pages/CartCheckout";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import "./App.css";
import "./config/amplify"; // Initialize Amplify
import VerifyEmail from "./pages/auth/EmailVerification";
import Home from "./pages/Home/Home";
import Menu from "./pages/Menu/Menu";
import Rewards from "./pages/Rewards";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import OrderHistory from "./pages/OrderHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            {/* Auth Routes - No Layout - Guest Only */}
            <Route
              path="/auth/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <ProtectedRoute requireAuth={false}>
                  <SignUp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPassword />
                </ProtectedRoute>
              }
            />
            <Route path="/auth/verify" element={<VerifyEmail />} />

            {/* Main App Routes - With Layout - Public */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/menu"
              element={
                <Layout>
                  <Menu />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <AboutUs />
                </Layout>
              }
            />
            <Route
              path="/rewards"
              element={
                <Layout>
                  <Rewards />
                </Layout>
              }
            />
            <Route
              path="/payment-success"
              element={
                <Layout>
                  <PaymentSuccess />
                </Layout>
              }
            />
            <Route
              path="/payment-failure"
              element={
                <Layout>
                  <PaymentFailure />
                </Layout>
              }
            />
            <Route
              path="/order-history"
              element={
                <Layout>
                  <OrderHistory />
                </Layout>
              }
            />


            {/* Protected Routes - Requires Authentication */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute requireAuth={true}>
                  <Layout>
                    <CartCheckout />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
