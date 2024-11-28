import React from "react";
import styled from "styled-components";
import { useAppSelector } from "../../../redux/hooks";
import { PlatoonType } from "shared";

const PanelContainer = styled.div`
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
`;

const UnitCard = styled.div`
  padding: 8px;
  margin-bottom: 8px;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PlatoonTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 1.5rem;
  color: #333;
`;

const UnitInfo = styled.div`
  font-size: 0.9rem;
  color: #555;
`;

const PlatoonPanel: React.FC = () => {
  const selectedPlatoon = useAppSelector(
    (state) => state.platoons.selectedPlatoon
  ) as PlatoonType | null;

  if (!selectedPlatoon) {
    return <PanelContainer>No platoon selected</PanelContainer>;
  }

  return (
    <PanelContainer>
      <PlatoonTitle>{selectedPlatoon.id}</PlatoonTitle>
      {selectedPlatoon.units.map((unit) => (
        <UnitCard key={unit.id}>
          <UnitInfo>
            <strong>Role:</strong> {unit.role}
          </UnitInfo>
          <UnitInfo>
            <strong>Health:</strong> {unit.health}
          </UnitInfo>
        </UnitCard>
      ))}
    </PanelContainer>
  );
};

export default PlatoonPanel;
