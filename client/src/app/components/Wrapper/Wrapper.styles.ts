import styled from "styled-components";

export const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

export const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const LeftPanel = styled.div`
  width: 20%;
  background-color: ${({ theme }) => theme.colors.surfaces.panel};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;
`;

export const MapContainer = styled.div`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.surfaces.panel};
  overflow: hidden;
`;

export const RightPanel = styled.div`
  width: 20%;
  background-color: ${({ theme }) => theme.colors.surfaces.panel};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;
`;
