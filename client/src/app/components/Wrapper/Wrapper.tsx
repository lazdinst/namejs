import React from "react";
import {
  WrapperContainer,
  MainContent,
  LeftPanel,
  MapContainer,
  RightPanel,
} from "./Wrapper.styles";
import { WrapperProps } from "./Wrapper.types";

const Wrapper: React.FC<WrapperProps> = ({
  topNav,
  leftPanel,
  map,
  rightPanel,
}) => {
  return (
    <WrapperContainer>
      {topNav}
      <MainContent>
        <LeftPanel>{leftPanel}</LeftPanel>
        <MapContainer>{map}</MapContainer>
        <RightPanel>{rightPanel}</RightPanel>
      </MainContent>
    </WrapperContainer>
  );
};

export default Wrapper;
