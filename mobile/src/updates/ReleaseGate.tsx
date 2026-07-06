import { ForceUpdateScreen } from './ForceUpdateScreen';
import { useReleaseGate } from './useReleaseGate';

type ReleaseGateProps = {
  children: React.ReactNode;
};

export function ReleaseGate({ children }: ReleaseGateProps) {
  const gate = useReleaseGate();

  if (gate.status === 'force-update') {
    return <ForceUpdateScreen requirements={gate.requirements} />;
  }

  return <>{children}</>;
}
