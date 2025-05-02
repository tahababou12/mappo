import { GraphData } from '../types';

export const sampleData: GraphData = {
  nodes: [
    { id: "1", name: "Abraham Lincoln", type: "person", startDate: "1809-02-12", endDate: "1865-04-15", description: "16th President of the United States", metadata: { profession: "Politician", nationality: "American" } },
    { id: "2", name: "Mary Todd Lincoln", type: "person", startDate: "1818-12-13", endDate: "1882-07-16", description: "First Lady of the United States", metadata: { profession: "First Lady", nationality: "American" } },
    { id: "3", name: "Republican Party", type: "organization", startDate: "1854", description: "Major political party in the United States", metadata: { type: "Political Party", country: "United States" } },
    { id: "4", name: "American Civil War", type: "event", startDate: "1861-04-12", endDate: "1865-05-09", description: "Civil war in the United States", metadata: { casualties: "620,000+", location: "United States" } },
    { id: "5", name: "Washington D.C.", type: "location", description: "Capital of the United States", metadata: { country: "United States", type: "Capital City" } },
    { id: "6", name: "Gettysburg Address", type: "event", startDate: "1863-11-19", description: "Famous speech by Abraham Lincoln", metadata: { location: "Gettysburg, Pennsylvania", significance: "High" } },
    { id: "7", name: "Ulysses S. Grant", type: "person", startDate: "1822-04-27", endDate: "1885-07-23", description: "18th President of the United States and Union Army general", metadata: { profession: "Military Officer, Politician", nationality: "American" } },
    { id: "8", name: "Robert E. Lee", type: "person", startDate: "1807-01-19", endDate: "1870-10-12", description: "Confederate general during the American Civil War", metadata: { profession: "Military Officer", nationality: "American" } },
    { id: "9", name: "Confederate States of America", type: "organization", startDate: "1861-02-08", endDate: "1865-05-09", description: "Breakaway confederate state during the American Civil War", metadata: { type: "Unrecognized State", country: "United States" } },
    { id: "10", name: "Battle of Gettysburg", type: "event", startDate: "1863-07-01", endDate: "1863-07-03", description: "Major battle of the American Civil War", metadata: { location: "Gettysburg, Pennsylvania", casualties: "46,000+" } },
    { id: "11", name: "Emancipation Proclamation", type: "event", startDate: "1863-01-01", description: "Presidential proclamation that changed the legal status of enslaved people", metadata: { significance: "High", type: "Presidential Proclamation" } },
    { id: "12", name: "Ford's Theatre", type: "location", description: "Site of Abraham Lincoln's assassination", metadata: { city: "Washington D.C.", country: "United States" } },
    { id: "13", name: "John Wilkes Booth", type: "person", startDate: "1838-05-10", endDate: "1865-04-26", description: "Assassin of Abraham Lincoln", metadata: { profession: "Actor", nationality: "American" } },
    { id: "14", name: "Lincoln Assassination", type: "event", startDate: "1865-04-14", description: "Assassination of Abraham Lincoln", metadata: { location: "Ford's Theatre, Washington D.C.", significance: "High" } },
    { id: "15", name: "William Seward", type: "person", startDate: "1801-05-16", endDate: "1872-10-10", description: "United States Secretary of State under Abraham Lincoln", metadata: { profession: "Politician", nationality: "American" } }
  ],
  links: [
    { id: "1", source: "1", target: "2", type: "family", description: "Marriage" },
    { id: "2", source: "1", target: "3", type: "political", description: "Party membership" },
    { id: "3", source: "1", target: "4", type: "political", description: "Led Union during war" },
    { id: "4", source: "1", target: "5", type: "social", description: "Lived and worked in" },
    { id: "5", source: "1", target: "6", type: "social", description: "Delivered speech" },
    { id: "6", source: "1", target: "7", type: "professional", description: "Commander-in-chief to general" },
    { id: "7", source: "7", target: "8", type: "conflict", description: "Military opponents" },
    { id: "8", source: "8", target: "9", type: "professional", description: "Military leader" },
    { id: "9", source: "4", target: "10", type: "social", description: "Major battle of war" },
    { id: "10", source: "7", target: "10", type: "social", description: "Participated in battle" },
    { id: "11", source: "8", target: "10", type: "social", description: "Participated in battle" },
    { id: "12", source: "1", target: "11", type: "professional", description: "Issued proclamation" },
    { id: "13", source: "1", target: "14", type: "social", description: "Victim of assassination" },
    { id: "14", source: "13", target: "14", type: "social", description: "Perpetrator of assassination" },
    { id: "15", source: "14", target: "12", type: "social", description: "Location of event" },
    { id: "16", source: "1", target: "15", type: "professional", description: "President to cabinet member" },
    { id: "17", source: "3", target: "4", type: "political", description: "Political entity in conflict" },
    { id: "18", source: "9", target: "4", type: "political", description: "Political entity in conflict" }
  ]
};
