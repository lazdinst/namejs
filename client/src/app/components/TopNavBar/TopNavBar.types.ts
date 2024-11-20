export interface TopNavBarProps {
  appName: string; // Name of the app to display in the nav bar
  links: { label: string; href: string }[]; // List of navigation links
  onSearch: (query: string) => void; // Callback for search input
}
