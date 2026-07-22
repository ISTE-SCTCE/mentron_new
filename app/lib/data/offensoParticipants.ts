export interface OffensoParticipant {
  name: string
  email: string
}

export const OFFENSO_PARTICIPANTS: OffensoParticipant[] = [
  { name: 'Fathima Wafa', email: 'fathimawafa414@gmail.com' },
  { name: 'Amritha Narayanan', email: 'amrithanarayanan43@gmail.com' },
  { name: 'Abhinand S Nath', email: 'abinanth@gmail.com' },
  { name: 'Hrishikesh Krishna J', email: 'hrishikeshkrishnaj@gmail.com' },
  { name: 'Sanjana P Chand', email: 'sanjanapchand@gmail.com' },
  { name: 'Kevin C Binu', email: 'kevincbinu67@gmail.com' },
  { name: 'Bala S Nair', email: 'balasnair7@gmail.com' },
  { name: 'Nithin Gopinath', email: 'nithingopinathofficial2006@gmail.com' },
  { name: 'Gopikrishna M Nambiar', email: 'gopikrishnanambiar@gmail.com' },
  { name: 'Sandra Mariya M R', email: 'sandramariyamr@gmail.com' },
  { name: 'Alisha S A', email: 'devu2007alisha@gmail.com' },
  { name: 'Sruthi S', email: 'sruthis11047@gmail.com' },
  { name: 'Aysha Ansar', email: 'aiyshaansar@gmail.com' },
  { name: 'Akash VR', email: 'akashvrofficial@gmail.com' },
  { name: 'Gayathri As', email: 'asgayathri48@gmail.com' },
  { name: 'Keerthana Pradeep', email: 'keerthanapp0507@gmail.com' },
  { name: 'Keerthana Nair B', email: 'keerthana.nbl@gmail.com' },
  { name: 'Niranjana J Warrier', email: 'niranjanajwarrier2006@gmail.com' },
  { name: 'Aparna Sreenivasan', email: 'aparnasreenivas27@gmail.com' },
  { name: 'Doyel Angel Shalish', email: 'doyel.angel.shalish@gmail.com' },
  { name: 'Adheena P B', email: 'adheena667@gmail.com' },
  { name: 'Pranav Raj P', email: 'pranavkarnan77@gmail.com' },
  { name: 'Goutham T', email: 'tgoutham96@gmail.com' },
  { name: 'Vidyuth S A', email: 'vidyuthsa@gmail.com' },
  { name: 'Gaganajanaky Roy', email: 'gag70812@gmail.com' },
  { name: 'Rishika Rangaraj', email: 'rrajrishika@gmail.com' },
  { name: 'KathirVelan RN', email: 'rn.kathirvelan7@gmail.com' },
  { name: 'Vaiga DP', email: 'vaigadpprayag@gmail.com' },
  { name: 'Sowbhagya S', email: 'sowbow1705@gmail.com' },
  { name: 'Mohammed Asim K S', email: 'mohammedasimks07@gmail.com' },
  { name: 'Vimal', email: 'vimal17student@gmail.com' },
  { name: 'Jyothika Shaji', email: 'jyothikashajikks@gmail.com' },
  { name: 'S. Bhadra Krishna', email: 'rs.bhadrakrishna@gmail.com' },
  { name: 'Nayana Salil', email: 'nandanayanam@gmail.com' },
  { name: 'Ashmi Joy', email: 'ashmi092007@gmail.com' },
  { name: 'Adithyan S', email: 'adithyans1369@gmail.com' },
  { name: 'Kasinathan P S', email: 'kasinathanps100@gmail.com' },
  { name: 'Swathy S', email: 'swathys862@gmail.com' },
  { name: 'Meenakshi A', email: 'meenakshiasha48@gmail.com' },
  { name: 'Harikrishna TK', email: 'harikrishnatka@gmail.com' },
  { name: 'Rebecca Merlin Abraham', email: 'rebeccamerlinabraham@gmail.com' },
  { name: 'Thejas Krishna', email: 'thejask9495@gmail.com' },
  { name: 'Chinmayi B S', email: 'chinmayi@gmail.com' },
  { name: 'Sreya Ashok', email: 'sreyaarnev@gmail.com' },
  { name: 'Harinath R', email: 'rharinath2006@gmail.com' },
  { name: 'Aljin S Jillu', email: 'aljinaljith2006@gmail.com' },
  { name: 'Adarsh P Vinod', email: 'adarshcr4@gmail.com' },
  { name: 'Sreenandan A M', email: 'nandananil372@gmail.com' },
  { name: 'Niranjana K', email: 'niranjanachinchuprakash@gmail.com' },
  { name: 'Arpithganga', email: 'gangaarpith901@gmail.com' },
  { name: 'Gowtham S', email: 'gowthamgowri73@gmail.com' },
  { name: 'Meenakshy R', email: 'meenakshyr73@gmail.com' },
  { name: 'Abhishek P Nair', email: 'abhishekpnair7@gmail.com' },
  { name: 'Gopika Pradeep', email: 'email4gopika@gmail.com' },
  { name: 'Harinath V', email: 'harinathv54@gmail.com' },
  { name: 'Reza Reyas', email: 'rezareyas8@gmail.com' },
  { name: 'Neha Maria Nebu', email: 'nehamarianebu7@gmail.com' },
  { name: 'Kezia Shaji', email: 'keziash036@gmail.com' },
  { name: 'Navami Krishna', email: 'navamiparu2006@gmail.com' },
  { name: 'Anakha A S', email: 'anakhaas06@gmail.com' },
]

export const OFFENSO_EMAILS: string[] = OFFENSO_PARTICIPANTS.map(p => p.email.toLowerCase())

export function isOffensoParticipant(email: string | null | undefined): boolean {
  if (!email) return false
  return OFFENSO_EMAILS.includes(email.toLowerCase().trim())
}
