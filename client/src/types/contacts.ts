export interface Contact {
  name: string[];
  tel: string[];
  email: string[];
}

declare global {
  interface Navigator {
    contacts: {
      select: (props: string[], options?: { multiple?: boolean }) => Promise<Contact[]>;
    };
  }
}
