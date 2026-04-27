/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/layout/Sidebar';
import { fetchUserProfile, verifyUserAuthorization } from './services/sheetService';
import { getAppConfig } from './apis/config';
import { TableType } from './types';

declare global {
  interface Window {
    google: any;
  }
}

// Page Components
import LandingPage from './pages/LandingPage';
import OrgChartPage from './pages/OrgChartPage';
import DataPage from './pages/DataPage';

// Common Components
import StatusBanner from './components/common/StatusBanner';
import CheckingScreen from './components/common/CheckingScreen';
import ConfigErrorScreen from './components/common/ConfigErrorScreen';
import PermissionDeniedScreen from './components/common/PermissionDeniedScreen';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('live');
  const [error, setError] = useState<string | null>(null);
  
  // Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem('gs_access_token'));
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userData, setUserData] = useState<any | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // const config = await getAppConfig();
        // if (config.googleClientId) {
        //   setGoogleClientId(config.googleClientId);
        // } else {
        //   setConfigError("Google Client ID is not configured on the server. Please set GOOGLE_CLIENT_ID in your environment variables.");
        // }
        
        // if (config.spreadsheetId) {
        //   setSpreadsheetId(config.spreadsheetId);
        // }
        setGoogleClientId(process.env.GOOGLE_CLIENT_ID || '1041613406784-5rnbpi7saldnbdlpsr4nve7bgnv1dh30.apps.googleusercontent.com');
        setSpreadsheetId(process.env.SPREADSHEET_ID || '14NM9PVywNKksD6waxWj2adzvHIkjHOKI_HCYFFJgAeg');
      } catch (err) {
        console.error("Config fetch error:", err);
        setConfigError("Failed to fetch runtime configuration from server.");
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!token || !spreadsheetId) {
        if (!token) setAuthStatus('unauthenticated');
        return;
      }

      setAuthStatus('checking');
      try {
        const profile = await fetchUserProfile(token);
        if (profile) {
          const user = {
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          };
          
          const isAuthorized = await verifyUserAuthorization(user.email, token, spreadsheetId);
          if (isAuthorized) {
            setUserData(user);
            setAuthStatus('authenticated');
            setPermissionDenied(false);
          } else {
            console.warn(`User ${user.email} is not authorized in the Employee sheet or cannot access the spreadsheet.`);
            setUserData(user);
            setPermissionDenied(true);
            setAuthStatus('authenticated');
          }
        } else {
          // If profile is null, it means the token might be invalid (401)
          handleLogout();
        }
      } catch (err) {
        // Only log if it's not a 401 (which we handle by logging out)
        if (!(axios.isAxiosError(err) && err.response?.status === 401)) {
          console.error("Verification error:", err);
        }
        handleLogout();
      }
    };

    verify();
  }, [token, spreadsheetId]);

  useEffect(() => {
    if (!googleClientId) return;

    const initGis = () => {
      if (window.google) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (response: any) => {
            if (response.error) {
              console.error("GIS Error:", response.error);
              setAuthStatus('unauthenticated');
              return;
            }
            if (response.access_token) {
              setToken(response.access_token);
              localStorage.setItem('gs_access_token', response.access_token);
            }
          },
        });
        setTokenClient(client);
      } else {
        setTimeout(initGis, 100);
      }
    };
    initGis();
  }, [googleClientId]);

  const handleSignIn = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    setUserData(null);
    localStorage.removeItem('gs_access_token');
    localStorage.removeItem('gs_user_data');
    setAuthStatus('unauthenticated');
  }, []);

  if (configError) {
    return <ConfigErrorScreen configError={configError} googleClientId={googleClientId} />;
  }

  if (authStatus === 'checking') {
    return <CheckingScreen />;
  }

  if (authStatus === 'unauthenticated') {
    return <LandingPage onSignIn={handleSignIn} />;
  }

  if (permissionDenied) {
    return <PermissionDeniedScreen email={userData?.email} onLogout={handleLogout} />;
  }

  return (
    <BrowserRouter>
      <MainLayout 
        user={userData} 
        onLogout={handleLogout}
        dataSource={dataSource}
        error={error}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <DataPage 
                token={token!} 
                spreadsheetId={spreadsheetId!} 
                onLogout={handleLogout}
                setDataSource={setDataSource}
                setError={setError}
                table="dashboard"
              />
            } 
          />
          <Route 
            path="/overview" 
            element={
              <DataPage 
                token={token!} 
                spreadsheetId={spreadsheetId!} 
                onLogout={handleLogout}
                setDataSource={setDataSource}
                setError={setError}
                table="overview"
              />
            } 
          />
          <Route 
            path="/data/:tableId" 
            element={
              <DataPage 
                token={token!} 
                spreadsheetId={spreadsheetId!} 
                onLogout={handleLogout}
                setDataSource={setDataSource}
                setError={setError}
              />
            } 
          />
          <Route 
            path="/org-chart" 
            element={
              <OrgChartPage 
                token={token!} 
                spreadsheetId={spreadsheetId!} 
                onLogout={handleLogout}
                setDataSource={setDataSource}
                setError={setError}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

