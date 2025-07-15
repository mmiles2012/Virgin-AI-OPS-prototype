import React, { useEffect, useState } from "react";
import { fetchStandInfo } from "../api/fetchStandInfo";
import { calculateStandConflict } from "../logic/calculateStandConflict";

const StandConflictTile = ({ inboundFlight }: { inboundFlight: any }) => {
  const [conflictResult, setConflictResult] = useState<any>(null);

  useEffect(() => {
    const checkConflict = async () => {
      const scheduled = await fetchStandInfo("EGLL");
      const result = calculateStandConflict(inboundFlight, scheduled);
      setConflictResult(result);
    };
    checkConflict();
  }, [inboundFlight]);

  if (!conflictResult) return <div>Loading stand conflict data...</div>;

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-bold mb-2">Stand Availability</h2>
      {conflictResult.conflict ? (
        <div className="text-red-600">
          <p><strong>Conflict:</strong> Gate {conflictResult.gate} still occupied.</p>
          <p><strong>Previous Flight:</strong> {conflictResult.previousFlightId}</p>
          <p><strong>Wait Time:</strong> {conflictResult.waitTime} min</p>
        </div>
      ) : (
        <div className="text-green-600">No stand conflict predicted 🎉</div>
      )}
    </div>
  );
};

export default StandConflictTile;