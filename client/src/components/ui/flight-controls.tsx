import { useKeyboardControls } from '@react-three/drei';
import { Badge } from '@/components/ui/badge';

enum FlightControls {
  pitchUp = 'pitchUp',
  pitchDown = 'pitchDown',
  rollLeft = 'rollLeft',
  rollRight = 'rollRight',
  yawLeft = 'yawLeft',
  yawRight = 'yawRight',
  throttleUp = 'throttleUp',
  throttleDown = 'throttleDown',
  autopilot = 'autopilot',
  emergency = 'emergency'
}

export default function FlightControls() {
  const [subscribe, getKeys] = useKeyboardControls<FlightControls>();

  const controls = [
    { name: 'Pitch Up', key: 'S', control: FlightControls.pitchUp },
    { name: 'Pitch Down', key: 'W', control: FlightControls.pitchDown },
    { name: 'Roll Left', key: 'A', control: FlightControls.rollLeft },
    { name: 'Roll Right', key: 'D', control: FlightControls.rollRight },
    { name: 'Yaw Left', key: 'Q', control: FlightControls.yawLeft },
    { name: 'Yaw Right', key: 'E', control: FlightControls.yawRight },
    { name: 'Throttle Up', key: 'R', control: FlightControls.throttleUp },
    { name: 'Throttle Down', key: 'F', control: FlightControls.throttleDown },
    { name: 'Autopilot', key: 'T', control: FlightControls.autopilot },
    { name: 'Emergency', key: 'Space', control: FlightControls.emergency }
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-blue-300 font-medium text-sm">Active Controls</h4>
      <div className="space-y-1">
        {controls.map(({ name, key, control }) => {
          const isPressed = getKeys()[control];
          return (
            <div key={control} className="flex items-center justify-between text-xs">
              <span className="text-blue-200">{name}</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant={isPressed ? "default" : "outline"} 
                  className="text-xs px-1 py-0"
                >
                  {key}
                </Badge>
                {isPressed && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
