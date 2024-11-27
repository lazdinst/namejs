import React from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setFaction } from "../../../redux/slices/platoons";
import { PlatoonFaction } from "shared";

const platoonFactions = Object.values(PlatoonFaction);
const PlatoonSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedFaction = useAppSelector(
    (state) => state.platoons.selectedFaction
  );

  const handleFactionChange = (faction: PlatoonFaction) => {
    dispatch(setFaction(faction));
  };

  return (
    <div>
      <h3>Select Platoon Faction</h3>
      {platoonFactions.map((faction) => (
        <label key={faction} style={{ display: "block", margin: "8px 0" }}>
          <input
            type="radio"
            name="faction"
            value={faction}
            checked={selectedFaction === faction}
            onChange={() => handleFactionChange(faction)}
          />
          {faction}
        </label>
      ))}
    </div>
  );
};

export default PlatoonSelector;
