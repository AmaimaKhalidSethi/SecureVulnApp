import { useContext } from 'react';
import { SecurityContext } from '../context/SecurityContext';

const useSecurityMode = () => useContext(SecurityContext);

export default useSecurityMode;