// Map location names to inventory column names
export const LOCATION_TO_COLUMN: { [key: string]: string } = {
  'Production': 'injection',
  'PipeLine': 'pipeline', 
  'Pre-Book': 'prebook',
  'Prebook': 'prebook',  // Alternative spelling
  'Await': 'await',
  'Await_grn': 'await_grn',
  'Fold Mill': 'fold',
  'Bulk Room': 'bulk',
  'Bulk': 'bulk',  // Alternative spelling
  'Back Car Park': 'backcarpark',
  'Backcarpark': 'backcarpark',  // Alternative spelling
  'Damage': 'damage'
};