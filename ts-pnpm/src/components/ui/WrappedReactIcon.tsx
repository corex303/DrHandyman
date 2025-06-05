import React from 'react';
import { type IconType } from 'react-icons';

// Define the WrappedReactIcon component
interface WrappedReactIconProps {
  icon: IconType;
  className?: string; // Ensure className can be passed through
  size?: number | string; // Adding size prop, allowing string or number
  // Allow any other SVG props
  [key: string]: any; 
}

const WrappedReactIcon = ({ icon, className, size, ...rest }: WrappedReactIconProps): JSX.Element => {
  const IconComponent = icon as React.ElementType;
  // Pass className, size, and any other props to the IconComponent
  return <IconComponent className={className} size={size} {...rest} />;
};

export default WrappedReactIcon; 