/** Szkic zawiadomienia do Prezesa UKE o niezamówionym kontakcie marketingowym (art. 398 PKE). Bez gróźb; tylko fakty. */
export interface DraftInput {
  name: string;
  phone?: string;
  callerNumber: string;
  timestamp: string;
  durationSeconds: number;
}

export function buildUkeDraft(d: DraftInput): string {
  const when = new Date(d.timestamp);
  const date = isNaN(when.getTime()) ? d.timestamp : when.toLocaleString('pl-PL');
  const caller = d.callerNumber && !d.callerNumber.startsWith('Rozmowa') ? d.callerNumber : '(numer dzwoniącego: uzupełnij z rejestru połączeń)';
  return [
    'Prezes Urzędu Komunikacji Elektronicznej',
    '',
    'ZAWIADOMIENIE o niezamówionym kontakcie marketingowym (art. 398 ustawy Prawo komunikacji elektronicznej)',
    '',
    `Zgłaszający: ${d.name}${d.phone ? `, numer telefonu: ${d.phone}` : ''}`,
    `Numer dzwoniącego: ${caller}`,
    `Data i godzina połączenia: ${date}`,
    `Czas trwania nagrania: ${Math.max(0, Math.round(d.durationSeconds))} s`,
    '',
    'Opis zdarzenia:',
    `W dniu ${date} otrzymałem(-am) na powyższy numer połączenie telefoniczne z numeru ${caller} o charakterze marketingu bezpośredniego. Nie wyrażałem(-am) zgody na taki kontakt.`,
    '',
    'Wnoszę o rozpatrzenie sprawy i podjęcie działań przewidzianych przepisami (w tym art. 444 i 446 ustawy Prawo komunikacji elektronicznej).',
    '',
    'Załączniki: nagranie rozmowy zapisane przeze mnie na własnym urządzeniu lub w mojej chmurze (dołączam własne nagranie).',
    '',
    'Data i podpis: ____________________',
    '',
    'Uwaga: to szkic wygenerowany przez aplikację. Sprawdź jego treść przed wysłaniem. TelePakt nie przechowuje ani nie publikuje nagrań - dołącz własną kopię.',
  ].join('\n');
}
