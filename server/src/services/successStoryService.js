export const successStories = [
  {
    id: 'story-1',
    name: 'Priya Sharma',
    exam: 'SSC CGL 2024',
    rank: 'AIR 42',
    quote:
      'Daily mocks and revision capsules helped me jump from 58% to 91% accuracy in three months.',
    imageColor: '#4F46E5',
  },
  {
    id: 'story-2',
    name: 'Rahul Verma',
    exam: 'Delhi Police Constable',
    rank: 'Selected',
    quote: 'Structured physical prep alongside GK drills made the difference in my final merit.',
    imageColor: '#DC2626',
  },
  {
    id: 'story-3',
    name: 'Ananya Iyer',
    exam: 'IBPS PO',
    rank: 'Probationary Officer',
    quote: 'Mentor sessions and sectional tests kept me accountable through prelims and mains.',
    imageColor: '#059669',
  },
];

export function listSuccessStories() {
  return { items: successStories };
}
