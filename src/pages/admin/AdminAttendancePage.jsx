import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  LogOut,
  Loader2,
  MapPin,
  Navigation,
  Save,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios';

const AdminAttendancePage = () => {
  const [identifier, setIdentifier] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Gym Location & Geofence Settings State
  const [gymSetting, setGymSetting] = useState({
    name: '',
    address: '',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 200,
    geofenceEnabled: true,
  });
  const [savingLocation, setSavingLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [locationErrorMsg, setLocationErrorMsg] = useState('');

  const fetchAttendanceLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoadingLogs(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/attendance?date=${today}`);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setLoadingLogs(false);
      setRefreshing(false);
    }
  };

  const fetchGymLocation = async () => {
    try {
      const res = await api.get('/settings/gym-location');
      if (res.data.success && res.data.setting) {
        setGymSetting({
          name: res.data.setting.name || 'ApexFit Flagship Club',
          address: res.data.setting.address || '',
          latitude: res.data.setting.latitude || 12.9716,
          longitude: res.data.setting.longitude || 77.5946,
          radiusMeters: res.data.setting.radiusMeters || 200,
          geofenceEnabled: res.data.setting.geofenceEnabled !== false,
        });
      }
    } catch (err) {
      console.error('Failed to load gym location:', err);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs();
    fetchGymLocation();

    const handleSync = () => {
      fetchAttendanceLogs(true);
      fetchGymLocation();
    };
    window.addEventListener('apexfit_sync_server', handleSync);
    return () => window.removeEventListener('apexfit_sync_server', handleSync);
  }, []);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setCheckingIn(true);
    setScanResult(null);

    try {
      const res = await api.post('/attendance/check-in', {
        identifier: identifier.trim(),
        method: 'kiosk',
      });

      setScanResult({
        success: true,
        isExpired: res.data.isExpired,
        message: res.data.message,
        member: res.data.member,
        membership: res.data.membership,
      });

      setIdentifier('');
      fetchAttendanceLogs(true);
    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Check-in failed. Please verify member ID.',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await api.post('/attendance/check-out', { attendanceId });
      fetchAttendanceLogs(true);
    } catch (err) {
      console.error('Check-out error:', err);
    }
  };

  // Grab Admin's Current GPS Location to populate Gym Coordinates with 1 click
  const handleUseCurrentLocation = () => {
    setLocationErrorMsg('');
    setLocationSuccessMsg('');

    if (!navigator.geolocation) {
      setLocationErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGymSetting((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setLocationSuccessMsg(
          `Acquired current device coordinates (Accuracy ±${Math.round(pos.coords.accuracy)}m). Click "Save Gym Location" to update MongoDB.`
        );
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationErrorMsg('Location access was denied or unavailable in your browser.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveGymLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    setLocationSuccessMsg('');
    setLocationErrorMsg('');

    try {
      const res = await api.put('/settings/gym-location', {
        name: gymSetting.name,
        address: gymSetting.address,
        latitude: Number(gymSetting.latitude),
        longitude: Number(gymSetting.longitude),
        radiusMeters: Number(gymSetting.radiusMeters),
        geofenceEnabled: gymSetting.geofenceEnabled,
      });

      if (res.data.success) {
        setLocationSuccessMsg('Gym location & geofence parameters updated in MongoDB Atlas!');
        setGymSetting(res.data.setting);
      }
    } catch (err) {
      console.error('Failed to update gym location:', err);
      setLocationErrorMsg(err.response?.data?.message || 'Failed to save gym location settings.');
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
            Attendance Scanner & Geofence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time digital pass verification, kiosk check-in, and GPS gym-location configuration.
          </p>
        </div>

        <button
          onClick={() => fetchAttendanceLogs(true)}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refetch Live DB</span>
        </button>
      </div>

      {/* Top Split: Desk Scanner (Left) & Gym Location Geofence Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Desk Scanner Terminal */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Desk Scanner Terminal</h3>
              <p className="text-xs text-slate-400">Scan or enter member code at turnstile</p>
            </div>
          </div>

          <form onSubmit={handleCheckInSubmit} className="flex gap-2">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter AF-1001, email, or phone..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={checkingIn}
              className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Check In</span>}
            </button>
          </form>

          {/* Scan Result Feedback */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                !scanResult.success
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : scanResult.isExpired
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {!scanResult.success ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Check-in Blocked</span>
                  </>
                ) : scanResult.isExpired ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>ATTENTION: Member Pass is EXPIRED</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pass Verified & Active</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 text-xs">{scanResult.message}</p>
              {scanResult.member && (
                <div className="text-[11px] text-slate-400 pt-1">
                  Member: <span className="font-semibold text-white">{scanResult.member.name}</span> (ID: {scanResult.member.memberCode})
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Gym Location & Accepted Radius Settings (Updatable by Admin) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gym Geofence Configuration</h3>
                <p className="text-xs text-slate-400">Configure target coordinates & check-in radius</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gettingLocation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Set gym latitude and longitude to your current physical GPS coordinates"
            >
              <Navigation className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
              <span>Use My GPS</span>
            </button>
          </div>

          {locationSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{locationSuccessMsg}</span>
            </div>
          )}

          {locationErrorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{locationErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveGymLocation} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gym Name</label>
                <input
                  type="text"
                  required
                  value={gymSetting.name}
                  onChange={(e) => setGymSetting({ ...gymSetting, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Accepted Radius (Meters)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="50000"
                  value={gymSetting.radiusMeters}
                  onChange={(e) =>
                    setGymSetting({ ...gymSetting, radiusMeters: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={gymSetting.latitude}
                  onChange={(e) =>
                    setGymSetting({ ...gymSetting, latitude: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={gymSetting.longitude}
                  onChange={(e) =>
                    setGymSetting({ ...gymSetting, longitude: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gym Physical Address</label>
              <input
                type="text"
                value={gymSetting.address}
                onChange={(e) => setGymSetting({ ...gymSetting, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={gymSetting.geofenceEnabled}
                  onChange={(e) =>
                    setGymSetting({ ...gymSetting, geofenceEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Enforce GPS Geofence for Member Attendance</span>
              </label>

              <button
                type="submit"
                disabled={savingLocation}
                className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 text-xs shadow-md shadow-amber-500/20"
              >
                {savingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save to MongoDB</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Today's Check-ins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Today's Check-in Feed</h3>
          </div>
          <span className="text-xs text-slate-400">{logs.length} entries recorded today</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Member</th>
                <th className="px-6 py-3.5">Check-in Time</th>
                <th className="px-6 py-3.5">Check-out Time</th>
                <th className="px-6 py-3.5">Pass Status</th>
                <th className="px-6 py-3.5">Check-in Method & Proximity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loadingLogs ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Loading today's attendance logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No check-ins recorded today yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-white">{log.memberId?.name || 'Member'}</div>
                      <div className="font-mono text-[10px] text-amber-400">
                        {log.memberId?.memberCode}
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="font-medium text-white">
                        {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      {log.checkOut ? (
                        <span className="text-slate-400">
                          {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          In Club
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.membershipStatusAtCheckIn === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {log.membershipStatusAtCheckIn === 'active' ? 'Active Pass' : 'Expired Alert'}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      {log.method === 'geofence_gps' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <span>GPS Geofence ({log.distanceMeters ?? 0}m)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase font-mono">
                          Desk Kiosk
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      {!log.checkOut && (
                        <button
                          onClick={() => handleCheckOut(log._id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Check Out</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendancePage;
