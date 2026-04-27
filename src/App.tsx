import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import axios from 'axios';

import { getAppConfig } from './config/app';
import CheckingScreen from './components/common/CheckingScreen';
import ConfigErrorScreen from './components/common/ConfigErrorScreen';
import PermissionDeniedScreen from './components/common/PermissionDeniedScreen';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import { fetchUserProfile, verifyUserAuthorization } from './services/sheetService';

declare global {
  interface Window {
    google?: any;
  }
}

const ACCESS_TOKEN_STORAGE_KEY = 'gs_access_token';
const DataPage = lazy(() => import('./pages/DataPage'));
const OrgChartPage = lazy(() => import('./pages/OrgChartPage'));

export default function App() {
  const [config] = useState(() => {
    try {
      return getAppConfig();
    } catch (error) {
      return error instanceof Error ? error : new Error('Runtime configuration is invalid.');
    }
  });
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('live');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userData, setUserData] = useState<{ email: string; name: string; picture?: string } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const googleClientId = config instanceof Error ? null : config.googleClientId;
  const spreadsheetId = config instanceof Error ? null : config.spreadsheetId;
  const configError = config instanceof Error ? config.message : null;

  useEffect(() => {
    const legacyToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (legacyToken && !sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)) {
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, legacyToken);
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setToken(null);
    setUserData(null);
    setPermissionDenied(false);
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setAuthStatus('unauthenticated');
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!token || !spreadsheetId) {
        if (!token) {
          setAuthStatus('unauthenticated');
        }
        return;
      }

      setAuthStatus('checking');

      try {
        const profile = await fetchUserProfile(token);
        if (!profile) {
          handleLogout();
          return;
        }

        const user = {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        };

        const isAuthorized = await verifyUserAuthorization(user.email, token, spreadsheetId);
        setUserData(user);
        setPermissionDenied(!isAuthorized);
        setAuthStatus('authenticated');
      } catch (err) {
        if (!(axios.isAxiosError(err) && err.response?.status === 401)) {
          console.error('Verification error:', err);
        }

        handleLogout();
      }
    };

    verify();
  }, [handleLogout, spreadsheetId, token]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let cancelled = false;

    const initGis = () => {
      if (cancelled) {
        return;
      }

      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope:
            'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (response: any) => {
            if (response.error) {
              console.error('GIS error:', response.error);
              setAuthStatus('unauthenticated');
              return;
            }

            if (response.access_token) {
              setToken(response.access_token);
              sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.access_token);
            }
          },
        });

        setTokenClient(client);
        return;
      }

      window.setTimeout(initGis, 100);
    };

    initGis();

    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  const handleSignIn = () => {
    tokenClient?.requestAccessToken();
  };

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
      <MainLayout user={userData} onLogout={handleLogout} dataSource={dataSource} error={error} spreadsheetId={spreadsheetId!}>
        <Suspense fallback={<CheckingScreen />}>
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
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
}
