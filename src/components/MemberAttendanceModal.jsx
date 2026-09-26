import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Navigation,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/axios';

const MemberAttendanceModal = ({ isOpen, onClose, memberCode: initialMemberCode, onCheckInSuccess }) => {
  const [memberIdentifier, setMemberIdentifier] = useState(initialMemberCode || '');
  const [gymSetting, setGymSetting] = useState(null);
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);
  const [simulateOnSite, setSimulateOnSite] = useState(false);

  useEffect(() => {
    if (initialMemberCode) {
      setMemberIdentifier(initialMemberCode);
    }
  }, [initialMemberCode]);

  useEffect(() => {
    if (isOpen) {
      fetchGymLocation();
      acquireGpsPosition();
      setResult(null);
      setErrorResult(null);
    }
  }, [isOpen]);

  const fetchGymLocation = async () => {
    try {
      const res = await api.get('/settings/gym-location');
      if (res.data.success) {
        setGymSetting(res.data.setting);
      }
    } catch (err) {
      console.error('Failed to load gym location:', err);
    }
  };

  const acquireGpsPosition = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGpsError(
          'Location access was denied or unavailable. Please allow GPS access in your browser.'
        );
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!memberIdentifier.trim()) {
      setErrorResult('Please enter your Member ID (e.g. AF-1001), Email, or Phone.');
      return;
    }

    if (!simulateOnSite && !deviceCoords) {
      setErrorResult('GPS coordinates are required to verify your presence at the gym.');
      return;
    }

    setSubmitting(true);
    setResult(null);
    setErrorResult(null);

    try {
      const payload = {
        identifier: memberIdentifier.trim(),
        latitude: deviceCoords?.latitude,
        longitude: deviceCoords?.longitude,
        simulateOnSite,
      };

      const res = await api.post('/attendance/geofence-checkin', payload);

      if (res.data.success) {
        setResult(res.data);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        if (onCheckInSuccess) {
          onCheckInSuccess(res.data);
        }
      }
    } catch (err) {
      console.error('Check-in rejected:', err);
      const data = err.response?.data;
      setErrorResult(data?.message || err.message || 'Check-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gym Location Attendance</h3>
              <p className="text-[11px] text-slate-400">GPS Proximity Check-in Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Success Result View */}
          {result ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Attendance Accepted!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Location verified: You are{' '}
                  <span className="font-bold text-emerald-400">{result.distanceMeters} meters</span> from the gym floor.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Member:</span>
                  <span className="font-semibold text-white">
                    {result.member?.name} ({result.member?.memberCode})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Club Location:</span>
                  <span className="font-medium text-slate-300">{result.gymName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Check-in Time:</span>
                  <span className="font-semibold text-emerald-400">
                    {new Date(result.attendance?.checkIn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verification Method:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    GPS Geofence Verified
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Check-in Form View */
            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              {/* Gym Target Card */}
              {gymSetting && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Club:</span>
                    <span className="font-bold text-white">{gymSetting.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Accepted Check-in Radius:</span>
                    <span className="font-semibold text-amber-400">{gymSetting.radiusMeters} meters</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{gymSetting.address}</div>
                </div>
              )}

              {/* GPS Detection Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Device GPS Status
                  </span>
                  <button
                    type="button"
                    onClick={acquireGpsPosition}
                    disabled={detectingGps}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                    <span>Refresh GPS</span>
                  </button>
                </div>

                {detectingGps ? (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Detecting current satellite location...</span>
                  </div>
                ) : deviceCoords ? (
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>
                      Coords:{' '}
                      <span className="font-mono text-slate-200">
                        {deviceCoords.latitude.toFixed(4)}, {deviceCoords.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="text-emerald-400 flex items-center gap-1 text-[10px]">
                      <ShieldCheck className="w-3 h-3" /> Location acquired with accuracy ±
                      {Math.round(deviceCoords.accuracy)}m
                    </div>
                  </div>
                ) : gpsError ? (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                ) : null}
              </div>

              {/* Error Message */}
              {errorResult && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorResult}</span>
                </div>
              )}

              {/* Member Identifier Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Member ID, Email, or Phone *
                </label>
                <input
                  type="text"
                  required
                  value={memberIdentifier}
                  onChange={(e) => setMemberIdentifier(e.target.value)}
                  placeholder="e.g. AF-1001 or arjun@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Testing / Sandbox Simulation Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={simulateOnSite}
                    onChange={(e) => setSimulateOnSite(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    <strong className="text-amber-400">Simulate On-Site GPS:</strong> Test check-in from any location
                  </span>
                </label>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Gym Proximity & Pass...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Confirm GPS Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberAttendanceModal;
