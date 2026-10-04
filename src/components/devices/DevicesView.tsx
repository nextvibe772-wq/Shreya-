import React, { useState } from 'react';
import {
  Cpu,
  Bluetooth,
  Monitor,
  ToggleLeft,
  ToggleRight,
  Power,
  RefreshCw,
  Lock,
  Plus,
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SmartDevice, PCDeviceConfig } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { BluetoothSkill } from '../../services/skills/BluetoothSkill';
import { SmartHomeSkill } from '../../services/skills/SmartHomeSkill';
import { PCSkill } from '../../services/skills/PCSkill';

export const DevicesView: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>(() => AppDatabase.getDevices());
  const [pcConfig, setPcConfig] = useState<PCDeviceConfig>(() => AppDatabase.getPCConfig());
  const [bleStatus, setBleStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const smartHomeSkill = new SmartHomeSkill();
  const pcSkill = new PCSkill();
  const bleSkill = new BluetoothSkill();

  const handleToggleDevice = async (device: SmartDevice) => {
    const newState = !device.payload?.state;
    await smartHomeSkill.execute({ device: device.name, state: newState });
    setDevices(AppDatabase.getDevices());
    setActionMessage(`Toggled ${device.name} to ${newState ? 'ON' : 'OFF'}`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleScanBLE = async () => {
    setIsScanning(true);
    setBleStatus('Opening Bluetooth discovery prompt...');
    try {
      const res = await bleSkill.execute({ action: 'scan' });
      setBleStatus(res.summary);
    } catch (e: any) {
      setBleStatus(`BLE Scan failed: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePCPing = async () => {
    const res = await pcSkill.execute({ action: 'status' });
    setPcConfig(AppDatabase.getPCConfig());
    setActionMessage(res.summary);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handlePCLock = async () => {
    const res = await pcSkill.execute({ action: 'lock' });
    setActionMessage(res.summary);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-neutral-900 border border-blue-800/40 rounded-3xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Cpu className="w-4 h-4" />
          <span>Hardware & Companion Architecture</span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
          Smart Home & PC Bridge
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl mt-1">
          Manage hardware peripherals: ESP32 IoT relays, Raspberry Pi hubs, Bluetooth Low Energy sensors, and PC companion workstation.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-neutral-900 border border-cyan-800 text-cyan-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Grid: ESP32 / Raspberry Pi Devices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            ESP32 & Raspberry Pi Nodes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => {
            const isPowerOn = Boolean(device.payload?.state);
            return (
              <div
                key={device.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-neutral-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isPowerOn
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-200">{device.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono">
                        {device.protocol.toUpperCase()} • {device.endpoint}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDevice(device)}
                    className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition-transform active:scale-95"
                    title="Toggle Device Power"
                  >
                    {isPowerOn ? (
                      <ToggleRight className="w-9 h-9 text-cyan-400 fill-cyan-950" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-neutral-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-800/80 text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPowerOn ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                    Status: {isPowerOn ? 'Active' : 'Standby'}
                  </span>
                  <div className="flex gap-1.5">
                    {device.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 rounded bg-neutral-950 text-[10px] text-neutral-400 border border-neutral-800">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PC Companion Bridge Section */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">{pcConfig.name}</h2>
              <p className="text-xs text-neutral-400 font-mono">
                Bridge Endpoint: {pcConfig.ip}:{pcConfig.port}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePCPing}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ping Status</span>
            </button>
            <button
              onClick={handlePCLock}
              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock PC</span>
            </button>
          </div>
        </div>

        {/* PC Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <span className="text-neutral-500 text-[10px] uppercase font-mono">CPU Usage</span>
            <p className="text-base font-bold text-cyan-400 font-mono">
              {pcConfig.stats?.cpu || 18}%
            </p>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <span className="text-neutral-500 text-[10px] uppercase font-mono">RAM Allocated</span>
            <p className="text-base font-bold text-indigo-400 font-mono">
              {pcConfig.stats?.ram || 42}%
            </p>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <span className="text-neutral-500 text-[10px] uppercase font-mono">Workstation OS</span>
            <p className="text-xs font-semibold text-neutral-300 truncate">
              {pcConfig.stats?.os || 'Linux'}
            </p>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <span className="text-neutral-500 text-[10px] uppercase font-mono">System Uptime</span>
            <p className="text-xs font-semibold text-neutral-300 font-mono">
              {pcConfig.stats?.uptime || 'Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Bluetooth BLE Section */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">Bluetooth & BLE Peripherals</h2>
              <p className="text-xs text-neutral-400">
                Scan and exchange GATT characteristics with smart rings, beacons, and speakers.
              </p>
            </div>
          </div>

          <button
            onClick={handleScanBLE}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning BLE...' : 'Scan Nearby Devices'}</span>
          </button>
        </div>

        {bleStatus && (
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-xl font-mono">
            {bleStatus}
          </div>
        )}
      </div>
    </div>
  );
};
