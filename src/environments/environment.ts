export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',

  supabase: {
    url: 'https://xiwvbhydrtusrrtsrxzu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpd3ZiaHlkcnR1c3JydHNyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Njk4NjQsImV4cCI6MjA5MjI0NTg2NH0.Jmi8ilx6enqEsP3652WJDFHJ_AdfcqGlddubZqZFeBw',
    //this bucket in Supabase Storage (recommended: public bucket)
    bucket: 'menu-item-images',
  },
};
