import React, { useEffect } from 'react';
import { useAppDispatch } from '../../redux/store';
import { useLocation } from 'react-router-dom';
import { setActiveRoute } from '../../redux/slices/ui';

const InitializeActiveRoute: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    console.log('Current URL path:', location.pathname);
    dispatch(setActiveRoute(location.pathname));
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default InitializeActiveRoute;
