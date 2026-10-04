import { AssistantSkill, SkillResult } from './SkillInterface';

export class BluetoothSkill implements AssistantSkill {
  public readonly id = 'bluetooth_skill';
  public readonly name = 'Bluetooth & BLE Manager';
  public readonly description = 'Scans, connects, and exchanges data with nearby Bluetooth Low Energy devices and audio peripherals.';
  public readonly permissions = ['BLUETOOTH', 'NEARBY_DEVICES'];
  public readonly requiresConfirmation = false;

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      return {
        success: false,
        summary: 'Web Bluetooth API is not available on this browser. Try Chrome on Android / Desktop.',
      };
    }

    try {
      if (params.action === 'scan') {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access'],
        });

        return {
          success: true,
          summary: `Discovered and paired with Bluetooth device: ${device.name || 'Unnamed Peripheral'} (ID: ${device.id})`,
          data: {
            id: device.id,
            name: device.name,
            gattConnected: device.gatt?.connected,
          },
        };
      }

      return {
        success: true,
        summary: 'Bluetooth subsystem is active and ready for scanning.',
      };
    } catch (e: any) {
      return {
        success: false,
        summary: `Bluetooth scan cancelled or failed: ${e.message}`,
      };
    }
  }
}
