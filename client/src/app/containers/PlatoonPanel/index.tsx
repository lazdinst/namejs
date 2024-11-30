import React from "react";
import styled from "styled-components";
import { useAppSelector } from "../../../redux/hooks";
import { PlatoonType } from "shared";
import { upperFirst } from "../../../utils/lodash";
import { RoleIconMap } from "../../../utils/RoleIconMap";
import { Role } from "shared";

const UnitIcon: React.FC<{ role: Role; color?: string }> = ({
  role,
  color = "white",
}) => {
  const IconComponent = RoleIconMap[role];

  return <IconComponent width={32} height={32} style={{ color }} />;
};

const PanelContainer = styled.div`
  padding: 16px;
  border-radius: 8px;
`;

const UnitCard = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PlatoonTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  font-size: 1.5rem;
  color: #333;
`;

const UnitInfo = styled.div`
  font-size: 0.9rem;
`;

const UnitIconContainer = styled.div`
  margin-right: ${({ theme }) => theme.spacing.medium};
`;

const UnitInfoContainer = styled.div`
  display: flex;
  color: #333;
  flex-direction: column;
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
          <UnitIconContainer>
            <UnitIcon role={unit.role} color="lime" />
          </UnitIconContainer>
          <UnitInfoContainer>
            <UnitInfo>
              <strong>Role:</strong> {upperFirst(unit.role)}
            </UnitInfo>
            <UnitInfo>
              <strong>Health:</strong> {unit.health}
            </UnitInfo>
          </UnitInfoContainer>
        </UnitCard>
      ))}
    </PanelContainer>
  );
};

export default PlatoonPanel;
