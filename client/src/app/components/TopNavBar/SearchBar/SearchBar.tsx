import React from 'react';
import { StyledSearchBar } from './SearchBar.styles';
import { SearchBarProps } from './SearchBar.types';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <StyledSearchBar
      type="text"
      placeholder="Search by name or ID"
      onChange={handleChange}
    />
  );
};

export default SearchBar;
