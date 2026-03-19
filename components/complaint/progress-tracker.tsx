import { CheckCircle2, Clock, User, Wrench, Flag, XCircle, AlertTriangle } from 'lucide-react';

const STEPS = [
  { key: 'PENDING',     label: 'Report Filed',     icon: Clock,        description: 'Your report has been submitted and is awaiting review.' },
  { key: 'ASSIGNED',    label: 'Assigned',          icon: User,         description: 'An authority has been assigned to handle your issue.' },
  { key: 'IN_PROGRESS', label: 'In Progress',       icon: Wrench,       description: 'Work is actively being done to resolve the issue.' },
  { key: 'RESOLVED',    label: 'Resolved',          icon: CheckCircle2, description: 'The issue has been successfully resolved!' },
];

function getStepIndex(status: string): number {
  if (status === 'REJECTED') return -1;
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function ProgressTracker({ status, createdAt, resolvedAt, isEscalated }: { status: string; createdAt: Date; resolvedAt?: Date | null; isEscalated?: boolean }) {
  const currentIndex = getStepIndex(status);
  const isRejected = status === 'REJECTED';

  if (isRejected) {
    return (
      <div className="bg-gray-900/40 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Status Timeline</h2>
        <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
          <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">Report Rejected</p>
            <p className="text-xs text-gray-400 mt-0.5">This report was reviewed and rejected by an authority.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {isEscalated && (
        <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-black text-orange-600 uppercase tracking-wider">Escalated to Higher Authority</p>
            <p className="text-xs text-[#475569] font-medium leading-relaxed">
              This issue has been pending for 10+ days. It has been automatically escalated to the Regional District Authority for immediate attention.
            </p>
          </div>
        </div>
      )}
      <h2 className="text-xs font-black text-[#1e293b] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
        <span className="w-8 h-1 bg-teal-500 rounded-full" />
        Status Timeline
      </h2>
      
      {/* Desktop: Horizontal stepper */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-100 z-0" />
          {/* Active line */}
          <div 
            className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 z-[1] transition-all duration-700 ease-out"
            style={{ width: `${currentIndex === 0 ? 0 : (currentIndex / (STEPS.length - 1)) * 80}%` }}
          />
          
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                {/* Circle */}
                <div className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 border-teal-400 shadow-lg shadow-teal-500/30' 
                    : isCurrent 
                      ? 'bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-500/20 animate-pulse' 
                      : 'bg-white border-gray-100'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon className={`w-5 h-5 ${isCurrent ? 'text-teal-400' : 'text-gray-300'}`} />
                  )}
                  {/* Ping animation for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border-2 border-teal-400/50 animate-ping" />
                  )}
                </div>

                {/* Label */}
                <p className={`mt-2 text-xs font-black text-center ${
                  isCompleted || isCurrent ? 'text-teal-500' : 'text-gray-300'
                }`}>
                  {step.label}
                </p>
                
                {/* Description */}
                <p className={`mt-1 text-[10px] text-center max-w-[120px] leading-tight font-medium ${
                  isCurrent ? 'text-[#475569]' : 'text-gray-300'
                }`}>
                  {isCurrent ? step.description : ''}
                </p>

                {/* Timestamp for first and last */}
                {index === 0 && (
                  <p className="mt-1 text-[9px] text-gray-500">
                    {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
                {index === STEPS.length - 1 && resolvedAt && (
                  <p className="mt-1 text-[9px] text-green-400">
                    {new Date(resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="sm:hidden space-y-0">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 border-teal-400' 
                    : isCurrent 
                      ? 'bg-teal-500/20 border-teal-400 animate-pulse' 
                      : 'bg-white border-gray-100'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-teal-400' : 'text-gray-300'}`} />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-8 ${isCompleted ? 'bg-teal-500' : 'bg-gray-100'}`} />
                )}
              </div>

              {/* Content */}
              <div className="pb-4">
                <p className={`text-sm font-black ${isCompleted || isCurrent ? 'text-teal-500' : 'text-gray-300'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-[#475569] mt-0.5 font-medium">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
