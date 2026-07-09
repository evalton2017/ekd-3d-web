export interface ItemMenu {
  route?: string;
  label: string;
  icon: string;
  roles: string[];
  children?: ItemMenu[];
  isOpen?: boolean;
}
