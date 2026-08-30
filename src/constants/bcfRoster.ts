export interface BCFRosterAgent {
  name: string;
  displayName: string;
  email: string;
  role: string;
}

export interface BCFRosterTeam {
  teamId: string;
  teamName: string;
  supervisor: {
    name: string;
    email: string;
  };
  agents: BCFRosterAgent[];
}

export const BCF_TEAMS: BCFRosterTeam[] = [
  {
    teamId: "cai-1",
    teamName: "CAI 1",
    supervisor: { name: "Dominick Grant", email: "dominick@bcflights.com" },
    agents: [
      { name: "Dominick Grant", displayName: "Dominick", email: "dominick@bcflights.com", role: "Independent Agent" }
    ]
  },
  {
    teamId: "cai-2",
    teamName: "CAI 2",
    supervisor: { name: "Jay Morgan", email: "jay@bcflights.com" },
    agents: [
      { name: "Thomas Miller", displayName: "Thomas", email: "thomas@bcflights.com", role: "Agent" },
      { name: "Lamar Garcia", displayName: "Lamar", email: "lamar@bcflights.com", role: "Agent" },
      { name: "Leo Vento", displayName: "Leo", email: "leo@bcflights.com", role: "Agent" },
      { name: "Wesley Navarro", displayName: "Wesley", email: "wesley@bcflights.com", role: "Agent" },
      { name: "Eric Williams", displayName: "Eric", email: "eric@bcflights.com", role: "Agent" },
      { name: "Solomon Morris", displayName: "Solomon", email: "solomon@bcflights.com", role: "Agent" },
      { name: "Fabiola Evans", displayName: "Fabiola", email: "fabiola@bcflights.com", role: "Agent" },
      { name: "Shay Lopez", displayName: "Shay", email: "shay@bcflights.com", role: "Agent" },
      { name: "Ilaya Rosewood", displayName: "Ilaya", email: "ilaya@bcflights.com", role: "Agent" },
      { name: "Brodie Fisher", displayName: "Brodie", email: "brodie@bcflights.com", role: "Agent" },
      { name: "Salma Wilson", displayName: "Salma", email: "salma@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-3",
    teamName: "CAI 3",
    supervisor: { name: "Albert Cooper", email: "albert@bcflights.com" },
    agents: [
      { name: "Avery Parker", displayName: "Avery", email: "avery@bcflights.com", role: "Agent" },
      { name: "Morgan Stein", displayName: "Morgan", email: "morgan@bcflights.com", role: "Agent" },
      { name: "Emma Quinn", displayName: "Emma", email: "emma@bcflights.com", role: "Agent" },
      { name: "Luka Ricci", displayName: "Luka", email: "luka@bcflights.com", role: "Agent" },
      { name: "Tyler Valente", displayName: "Tyler", email: "tyler@bcflights.com", role: "Agent" },
      { name: "Crosby Zaki", displayName: "Crosby", email: "crosby@bcflights.com", role: "Agent" },
      { name: "Oscar Reed", displayName: "Oscar", email: "oscar@bcflights.com", role: "Agent" },
      { name: "Jordan Glassman", displayName: "Jordan", email: "jordan@bcflights.com", role: "Agent" },
      { name: "Cillian O'connor", displayName: "Cillian", email: "cillian@bcflights.com", role: "Agent" },
      { name: "Joe Green", displayName: "Joe", email: "joe@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-4",
    teamName: "CAI 4",
    supervisor: { name: "Watkins West", email: "watkins@bcflights.com" },
    agents: [
      { name: "Alexander Fleming", displayName: "Alexander", email: "alexander@bcflights.com", role: "Agent" },
      { name: "Tony Carter", displayName: "Tony", email: "tony@bcflights.com", role: "Agent" },
      { name: "Jason Owen", displayName: "Jason", email: "jason@bcflights.com", role: "Agent" },
      { name: "Forbes Whitlock", displayName: "Forbes", email: "forbes@bcflights.com", role: "Agent" },
      { name: "Scott Daskin", displayName: "Scott", email: "scott@bcflights.com", role: "Agent" },
      { name: "Rufus Kennett", displayName: "Rufus", email: "rufus@bcflights.com", role: "Agent" },
      { name: "Jacob Adams", displayName: "Jacob", email: "jacob@bcflights.com", role: "Agent" },
      { name: "Noah Hayes", displayName: "Noah", email: "noah@bcflights.com", role: "Agent" },
      { name: "Henry Bennet", displayName: "Henry", email: "henry@bcflights.com", role: "Agent" },
      { name: "William Jackson", displayName: "William", email: "william@bcflights.com", role: "Agent" },
      { name: "Max Evans", displayName: "Max", email: "max@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-5",
    teamName: "CAI 5",
    supervisor: { name: "Amir Malik", email: "amir@bcflights.com" },
    agents: [
      { name: "Zane Wilson", displayName: "Zane", email: "zane@bcflights.com", role: "Agent" },
      { name: "Avicci Cade", displayName: "Avicci", email: "avicci@bcflights.com", role: "Agent" },
      { name: "Lorraine Harper", displayName: "Lorraine", email: "lorraine@bcflights.com", role: "Agent" },
      { name: "Vella Watson", displayName: "Vella", email: "vella@bcflights.com", role: "Agent" },
      { name: "Miller Smith", displayName: "Miller", email: "miller@bcflights.com", role: "Agent" },
      { name: "Adryana Noelle", displayName: "Adryana", email: "adryana@bcflights.com", role: "Agent" },
      { name: "Mccoy Sullivan", displayName: "Mccoy", email: "mccoy@bcflights.com", role: "Agent" }
    ]
  }
];
