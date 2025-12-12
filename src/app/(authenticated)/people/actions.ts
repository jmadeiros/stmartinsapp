'use server'

import { createClient } from "@/lib/supabase/server"

// Mock data for development
const MOCK_ORGANIZATIONS: OrganizationProfile[] = [
  {
    id: 'org-1',
    name: 'St Martins',
    slug: 'st-martins',
    description: 'Supporting people experiencing homelessness in London with emergency accommodation, outreach services, and pathways to independent living.',
    logo_url: null,
    website: 'https://stmartins.org.uk',
    mission: 'Ending homelessness through support, accommodation, and opportunity.',
    cause_areas: ['Homelessness', 'Housing', 'Mental Health'],
    primary_color: '#10b981',
    social_links: { linkedin: 'https://linkedin.com/company/stmartins' },
    member_count: 12,
  },
  {
    id: 'org-2',
    name: 'Hope Kitchen',
    slug: 'hope-kitchen',
    description: 'Community kitchen providing nutritious meals and a welcoming space for those in need.',
    logo_url: null,
    website: 'https://hopekitchen.org',
    mission: 'No one should go hungry. We provide meals with dignity and warmth.',
    cause_areas: ['Food Security', 'Community', 'Wellbeing'],
    primary_color: '#f59e0b',
    social_links: null,
    member_count: 8,
  },
  {
    id: 'org-3',
    name: 'Youth Forward',
    slug: 'youth-forward',
    description: 'Empowering young people through mentorship, education support, and career development programs.',
    logo_url: null,
    website: 'https://youthforward.org',
    mission: 'Every young person deserves the chance to thrive.',
    cause_areas: ['Youth', 'Education', 'Employment'],
    primary_color: '#8b5cf6',
    social_links: { linkedin: 'https://linkedin.com/company/youthforward' },
    member_count: 6,
  },
  {
    id: 'org-4',
    name: 'Green Spaces Trust',
    slug: 'green-spaces',
    description: 'Creating and maintaining community gardens and green spaces for mental wellbeing and environmental education.',
    logo_url: null,
    website: 'https://greenspaces.org',
    mission: 'Bringing nature to communities for healthier, happier lives.',
    cause_areas: ['Environment', 'Mental Health', 'Community'],
    primary_color: '#22c55e',
    social_links: null,
    member_count: 5,
  },
]

const MOCK_PEOPLE: PersonProfile[] = [
  {
    user_id: 'user-1',
    full_name: 'Sarah Chen',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Passionate about creating sustainable solutions to homelessness. 10+ years in the charity sector.',
    job_title: 'Director of Services',
    skills: ['Leadership', 'Fundraising', 'Strategy'],
    interests: ['Social Policy', 'Urban Planning'],
    linkedin_url: 'https://linkedin.com/in/sarahchen',
    contact_email: 'sarah.chen@stmartins.org',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-2',
    full_name: 'Marcus Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Former rough sleeper turned outreach worker. I know firsthand what support means.',
    job_title: 'Outreach Coordinator',
    skills: ['Outreach', 'Crisis Support', 'Lived Experience'],
    interests: ['Peer Support', 'Recovery'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-3',
    full_name: 'Emma Williams',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Communications specialist helping charities tell their stories and reach more people.',
    job_title: 'Head of Communications',
    skills: ['Marketing', 'PR', 'Social Media', 'Content'],
    interests: ['Storytelling', 'Digital Strategy'],
    linkedin_url: 'https://linkedin.com/in/emmawilliams',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-4',
    full_name: 'David Okonkwo',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Running the kitchen that feeds hundreds every week. Food is love.',
    job_title: 'Kitchen Manager',
    skills: ['Catering', 'Volunteer Management', 'Food Safety'],
    interests: ['Nutrition', 'Community Building'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-5',
    full_name: 'Priya Patel',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    bio: 'Youth worker dedicated to helping young people find their path. Every young person has potential.',
    job_title: 'Youth Programme Lead',
    skills: ['Youth Work', 'Mentoring', 'Safeguarding'],
    interests: ['Education', 'Career Development'],
    linkedin_url: 'https://linkedin.com/in/priyapatel',
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-6',
    full_name: 'James Morrison',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Volunteer coordinator bringing people together to make a difference.',
    job_title: 'Volunteer Coordinator',
    skills: ['Recruitment', 'Training', 'Event Planning'],
    interests: ['Community Engagement', 'Social Impact'],
    linkedin_url: 'https://linkedin.com/in/jamesmorrison',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-7',
    full_name: 'Amira Hassan',
    avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    bio: 'Mental health support worker. Everyone deserves to be heard.',
    job_title: 'Wellbeing Support Worker',
    skills: ['Mental Health', 'Counselling', 'Trauma-Informed Care'],
    interests: ['Mindfulness', 'Holistic Health'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-8',
    full_name: 'Tom Richardson',
    avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
    bio: 'Environmental educator helping communities connect with nature.',
    job_title: 'Community Garden Lead',
    skills: ['Horticulture', 'Education', 'Community Development'],
    interests: ['Sustainability', 'Urban Farming'],
    linkedin_url: 'https://linkedin.com/in/tomrichardson',
    visibility: 'network',
    organization: { id: 'org-4', name: 'Green Spaces Trust', logo_url: null, primary_color: '#22c55e' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-9',
    full_name: 'Lisa Thompson',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    bio: 'Fundraiser with a passion for impact. Together we can do more.',
    job_title: 'Fundraising Manager',
    skills: ['Grant Writing', 'Corporate Partnerships', 'Events'],
    interests: ['Philanthropy', 'Impact Measurement'],
    linkedin_url: 'https://linkedin.com/in/lisathompson',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-10',
    full_name: 'Michael Brown',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Data analyst helping charities understand their impact through numbers.',
    job_title: 'Impact & Data Analyst',
    skills: ['Data Analysis', 'Reporting', 'Excel', 'SQL'],
    interests: ['Social Impact', 'Data Visualization'],
    linkedin_url: 'https://linkedin.com/in/michaelbrown',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-11',
    full_name: 'Rachel Green',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    bio: 'Social worker supporting families through challenging times.',
    job_title: 'Family Support Worker',
    skills: ['Social Work', 'Case Management', 'Advocacy'],
    interests: ['Family Welfare', 'Child Development'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-12',
    full_name: 'Alex Kim',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    bio: 'Tech volunteer building digital tools for social good.',
    job_title: 'Digital Volunteer',
    skills: ['Web Development', 'UX Design', 'Project Management'],
    interests: ['Tech for Good', 'Open Source'],
    linkedin_url: 'https://linkedin.com/in/alexkim',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'volunteer',
  },
  {
    user_id: 'user-13',
    full_name: 'Sophie Martin',
    avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    bio: 'Nutrition specialist ensuring our meals are healthy and delicious.',
    job_title: 'Nutrition Advisor',
    skills: ['Nutrition', 'Menu Planning', 'Food Education'],
    interests: ['Public Health', 'Food Justice'],
    linkedin_url: 'https://linkedin.com/in/sophiemartin',
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-14',
    full_name: 'Daniel Lee',
    avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    bio: 'Housing officer helping people find and maintain stable accommodation.',
    job_title: 'Housing Officer',
    skills: ['Housing Law', 'Tenancy Support', 'Benefits Advice'],
    interests: ['Housing Policy', 'Tenant Rights'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-15',
    full_name: 'Olivia Taylor',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
    bio: 'Event coordinator bringing the community together through meaningful gatherings.',
    job_title: 'Events Coordinator',
    skills: ['Event Planning', 'Logistics', 'Stakeholder Management'],
    interests: ['Community Events', 'Networking'],
    linkedin_url: 'https://linkedin.com/in/oliviataylor',
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  // Additional people to match login page sphere density (48 total)
  {
    user_id: 'user-16',
    full_name: 'Nathan Brooks',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Community liaison building bridges between organizations.',
    job_title: 'Community Liaison',
    skills: ['Communication', 'Networking', 'Advocacy'],
    interests: ['Community Building'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-17',
    full_name: 'Fatima Al-Hassan',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    bio: 'Mental health advocate with trauma-informed care expertise.',
    job_title: 'Counsellor',
    skills: ['Counselling', 'Crisis Intervention', 'Group Therapy'],
    interests: ['Mental Health', 'Mindfulness'],
    linkedin_url: 'https://linkedin.com/in/fatimaalhassan',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-18',
    full_name: 'Chris Walker',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Facilities manager keeping our spaces safe and welcoming.',
    job_title: 'Facilities Manager',
    skills: ['Facilities Management', 'Health & Safety', 'Maintenance'],
    interests: ['Sustainability'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-19',
    full_name: 'Maya Singh',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    bio: 'Youth mentor passionate about education and empowerment.',
    job_title: 'Youth Mentor',
    skills: ['Mentoring', 'Teaching', 'Youth Engagement'],
    interests: ['Education', 'Youth Empowerment'],
    linkedin_url: 'https://linkedin.com/in/mayasingh',
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-20',
    full_name: 'Peter O\'Connor',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Volunteer coordinator with 5 years experience.',
    job_title: 'Volunteer Lead',
    skills: ['Volunteer Management', 'Training', 'Scheduling'],
    interests: ['Community Service'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-4', name: 'Green Spaces Trust', logo_url: null, primary_color: '#22c55e' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-21',
    full_name: 'Zara Ahmed',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Digital skills trainer helping people get online.',
    job_title: 'Digital Inclusion Officer',
    skills: ['Digital Literacy', 'Training', 'IT Support'],
    interests: ['Technology', 'Digital Inclusion'],
    linkedin_url: 'https://linkedin.com/in/zaraahmed',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-22',
    full_name: 'Roberto Garcia',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Head chef creating nutritious meals with love.',
    job_title: 'Head Chef',
    skills: ['Cooking', 'Menu Planning', 'Kitchen Management'],
    interests: ['Nutrition', 'Food Education'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-23',
    full_name: 'Hannah Wright',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    bio: 'Arts therapist using creativity for healing.',
    job_title: 'Arts Therapist',
    skills: ['Art Therapy', 'Group Facilitation', 'Creative Expression'],
    interests: ['Arts', 'Mental Health'],
    linkedin_url: 'https://linkedin.com/in/hannahwright',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-24',
    full_name: 'Kwame Asante',
    avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    bio: 'Sports coach running fitness programs.',
    job_title: 'Sports Coach',
    skills: ['Sports Coaching', 'Fitness', 'Team Building'],
    interests: ['Sports', 'Youth Development'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-25',
    full_name: 'Elena Petrova',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    bio: 'Finance officer ensuring sustainable operations.',
    job_title: 'Finance Officer',
    skills: ['Finance', 'Budgeting', 'Reporting'],
    interests: ['Social Enterprise'],
    linkedin_url: 'https://linkedin.com/in/elenapetrova',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-26',
    full_name: 'Ben Thompson',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
    bio: 'IT support keeping systems running smoothly.',
    job_title: 'IT Support',
    skills: ['IT Support', 'Systems Admin', 'Troubleshooting'],
    interests: ['Technology'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-27',
    full_name: 'Grace Okafor',
    avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
    bio: 'Social worker specializing in family support.',
    job_title: 'Family Support Worker',
    skills: ['Social Work', 'Family Support', 'Case Management'],
    interests: ['Child Welfare'],
    linkedin_url: 'https://linkedin.com/in/graceokafor',
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-28',
    full_name: 'Jack Murphy',
    avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
    bio: 'Maintenance technician and handyman extraordinaire.',
    job_title: 'Maintenance Tech',
    skills: ['Maintenance', 'Repairs', 'DIY'],
    interests: ['Practical Skills'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-29',
    full_name: 'Leila Rahman',
    avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    bio: 'HR manager fostering inclusive workplaces.',
    job_title: 'HR Manager',
    skills: ['HR', 'Recruitment', 'Employee Relations'],
    interests: ['DEI', 'Workplace Culture'],
    linkedin_url: 'https://linkedin.com/in/leilarahman',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-30',
    full_name: 'Oscar Lindqvist',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    bio: 'Environmental educator passionate about sustainability.',
    job_title: 'Environmental Educator',
    skills: ['Environmental Education', 'Workshop Facilitation', 'Sustainability'],
    interests: ['Climate Action'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-4', name: 'Green Spaces Trust', logo_url: null, primary_color: '#22c55e' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-31',
    full_name: 'Tanya Miller',
    avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    bio: 'Communications specialist telling impactful stories.',
    job_title: 'Communications Lead',
    skills: ['Communications', 'PR', 'Storytelling'],
    interests: ['Media', 'Social Impact'],
    linkedin_url: 'https://linkedin.com/in/tanyamiller',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-32',
    full_name: 'Ahmed Khalil',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    bio: 'Security officer ensuring safe spaces.',
    job_title: 'Security Officer',
    skills: ['Security', 'Conflict Resolution', 'First Aid'],
    interests: ['Community Safety'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-33',
    full_name: 'Isla Campbell',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    bio: 'Reception coordinator and first point of contact.',
    job_title: 'Reception Coordinator',
    skills: ['Customer Service', 'Administration', 'Multitasking'],
    interests: ['Hospitality'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-34',
    full_name: 'Raj Patel',
    avatar_url: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=150&h=150&fit=crop&crop=face',
    bio: 'Employment advisor helping people find work.',
    job_title: 'Employment Advisor',
    skills: ['Career Coaching', 'CV Writing', 'Interview Prep'],
    interests: ['Employment', 'Skills Development'],
    linkedin_url: 'https://linkedin.com/in/rajpatel',
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-35',
    full_name: 'Lucy Evans',
    avatar_url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face',
    bio: 'Volunteer bringing energy to every project.',
    job_title: 'Weekend Volunteer',
    skills: ['Enthusiasm', 'Teamwork', 'Flexibility'],
    interests: ['Volunteering'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-4', name: 'Green Spaces Trust', logo_url: null, primary_color: '#22c55e' },
    role: 'volunteer',
  },
  {
    user_id: 'user-36',
    full_name: 'Marcus Reid',
    avatar_url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
    bio: 'Peer support worker with lived experience.',
    job_title: 'Peer Support Worker',
    skills: ['Peer Support', 'Active Listening', 'Empathy'],
    interests: ['Recovery', 'Peer Support'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-37',
    full_name: 'Yuki Tanaka',
    avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face',
    bio: 'Graphic designer creating visual impact.',
    job_title: 'Graphic Designer',
    skills: ['Graphic Design', 'Branding', 'Adobe Creative'],
    interests: ['Design', 'Visual Arts'],
    linkedin_url: 'https://linkedin.com/in/yukitanaka',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'volunteer',
  },
  {
    user_id: 'user-38',
    full_name: 'Sam Williams',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&sat=-30',
    bio: 'Driver and logistics support.',
    job_title: 'Driver',
    skills: ['Driving', 'Logistics', 'Time Management'],
    interests: ['Travel'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-39',
    full_name: 'Nina Johansson',
    avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    bio: 'Researcher measuring social impact.',
    job_title: 'Research Analyst',
    skills: ['Research', 'Data Analysis', 'Report Writing'],
    interests: ['Social Research'],
    linkedin_url: 'https://linkedin.com/in/ninajohansson',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-40',
    full_name: 'Kevin O\'Neill',
    avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face&sat=-20',
    bio: 'Building maintenance and gardening.',
    job_title: 'Groundskeeper',
    skills: ['Gardening', 'Landscaping', 'Building Maintenance'],
    interests: ['Nature'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-4', name: 'Green Spaces Trust', logo_url: null, primary_color: '#22c55e' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-41',
    full_name: 'Ava Chen',
    avatar_url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face',
    bio: 'Legal advisor specializing in housing rights.',
    job_title: 'Legal Advisor',
    skills: ['Legal Advice', 'Housing Law', 'Advocacy'],
    interests: ['Legal Aid', 'Housing Rights'],
    linkedin_url: 'https://linkedin.com/in/avachen',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-42',
    full_name: 'Jordan Blake',
    avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face&hue=30',
    bio: 'Music therapist using sound for healing.',
    job_title: 'Music Therapist',
    skills: ['Music Therapy', 'Performance', 'Group Sessions'],
    interests: ['Music', 'Mental Health'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-43',
    full_name: 'Patricia Nowak',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face&sat=-40',
    bio: 'Health visitor supporting new families.',
    job_title: 'Health Visitor',
    skills: ['Health Visiting', 'Parent Support', 'Child Development'],
    interests: ['Child Health'],
    linkedin_url: 'https://linkedin.com/in/patricianowak',
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-44',
    full_name: 'Tyler Scott',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&contrast=10',
    bio: 'Sous chef with a passion for local ingredients.',
    job_title: 'Sous Chef',
    skills: ['Cooking', 'Food Prep', 'Kitchen Safety'],
    interests: ['Culinary Arts'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-2', name: 'Hope Kitchen', logo_url: null, primary_color: '#f59e0b' },
    role: 'partner_staff',
  },
  {
    user_id: 'user-45',
    full_name: 'Chloe Adams',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    bio: 'Social media manager amplifying our message.',
    job_title: 'Social Media Manager',
    skills: ['Social Media', 'Content Creation', 'Analytics'],
    interests: ['Digital Marketing'],
    linkedin_url: 'https://linkedin.com/in/chloeadams',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-46',
    full_name: 'William Hughes',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face&sat=-50',
    bio: 'Night shelter manager ensuring safe rest.',
    job_title: 'Night Manager',
    skills: ['Shelter Management', 'Crisis Response', 'Staff Supervision'],
    interests: ['Homelessness'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'st_martins_staff',
  },
  {
    user_id: 'user-47',
    full_name: 'Ruby Foster',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face&hue=60',
    bio: 'Trustee bringing governance expertise.',
    job_title: 'Trustee',
    skills: ['Governance', 'Strategy', 'Finance'],
    interests: ['Charity Governance'],
    linkedin_url: 'https://linkedin.com/in/rubyfoster',
    visibility: 'network',
    organization: { id: 'org-1', name: 'St Martins', logo_url: null, primary_color: '#10b981' },
    role: 'admin',
  },
  {
    user_id: 'user-48',
    full_name: 'Leo Martinez',
    avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face&hue=20',
    bio: 'Youth worker connecting with young people.',
    job_title: 'Youth Worker',
    skills: ['Youth Work', 'Mentoring', 'Activity Planning'],
    interests: ['Youth Development'],
    linkedin_url: null,
    visibility: 'network',
    organization: { id: 'org-3', name: 'Youth Forward', logo_url: null, primary_color: '#8b5cf6' },
    role: 'partner_staff',
  },
]

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: 'act-1', type: 'event', title: 'Winter Shelter Opening Night', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'act-2', type: 'project', title: 'Community Garden Expansion', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' },
  { id: 'act-3', type: 'event', title: 'Volunteer Training Workshop', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'act-4', type: 'project', title: 'Mobile Outreach Van Initiative', created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'planning' },
  { id: 'act-5', type: 'event', title: 'Christmas Community Lunch', created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
]

export type PersonProfile = {
  user_id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  skills: string[] | null
  interests: string[] | null
  linkedin_url: string | null
  contact_email?: string | null
  visibility: string
  organization: {
    id: string
    name: string
    logo_url: string | null
    primary_color: string | null
  } | null
  role: string | null
}

export type OrganizationProfile = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  mission: string | null
  cause_areas: string[] | null
  primary_color: string | null
  social_links: Record<string, string> | null
  member_count: number
}

export type RecentActivity = {
  id: string
  type: 'event' | 'project'
  title: string
  created_at: string
  status?: string
}

export async function getPeopleData(): Promise<PersonProfile[]> {
  const supabase = await createClient()

  // Fetch user profiles with organization_id and role directly
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      avatar_url,
      bio,
      job_title,
      skills,
      interests,
      linkedin_url,
      contact_email,
      visibility,
      organization_id,
      role
    `)
    .order('full_name')

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  // Get unique organization IDs
  const orgIds = Array.from(new Set((profiles as any[] | null)?.map((p: any) => p.organization_id).filter(Boolean) || []))

  // Fetch organizations
  const { data: organizations } = orgIds.length > 0 ? await supabase
    .from('organizations')
    .select('id, name, logo_url, primary_color')
    .in('id', orgIds)
  : { data: null }

  // Create a lookup map for organizations
  const orgMap = new Map(
    (organizations as any[] | null)?.map((o: any) => [o.id, o]) || []
  )

  // Combine profiles with their organization data
  const result = ((profiles || []) as any[]).map((profile: any) => {
    const org = orgMap.get(profile.organization_id) as any
    return {
      ...profile,
      organization: org ? {
        id: org.id,
        name: org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color
      } : null,
    }
  })

  // Return mock data if no real data exists
  if (result.length === 0) {
    return MOCK_PEOPLE
  }

  return result
}

export async function getOrganizationsData(): Promise<OrganizationProfile[]> {
  const supabase = await createClient()

  // Fetch organizations
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      website,
      mission,
      cause_areas,
      primary_color,
      social_links
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  // Get member counts for each org from user_profiles
  const orgIds = (organizations as any[] | null)?.map((o: any) => o.id) || []
  const { data: memberCounts } = orgIds.length > 0 ? await supabase
    .from('user_profiles')
    .select('organization_id')
    .in('organization_id', orgIds)
  : { data: null }

  // Count members per org
  const countMap = new Map<string, number>()
  ;(memberCounts as any[] | null)?.forEach((m: any) => {
    countMap.set(m.organization_id, (countMap.get(m.organization_id) || 0) + 1)
  })

  // Check if we have any real member data
  const hasRealMembers = (memberCounts?.length || 0) > 0

  // Compute mock member counts from MOCK_PEOPLE for demo purposes
  const mockCountMap = new Map<string, number>()
  MOCK_PEOPLE.forEach(p => {
    if (p.organization?.id) {
      mockCountMap.set(p.organization.id, (mockCountMap.get(p.organization.id) || 0) + 1)
    }
  })

  // Map org names to mock org ids for fallback counts
  const orgNameToMockId: Record<string, string> = {
    'St Martin\'s Hub': 'org-1',
    'St Martins': 'org-1',
    'Hope Kitchen': 'org-2',
    'Youth Action Network': 'org-3',
    'Youth Forward': 'org-3',
    'Community Arts Trust': 'org-4',
    'Green Spaces Trust': 'org-4',
  }

  const result = ((organizations || []) as any[]).map((org: any) => {
    const realCount = countMap.get(org.id) || 0
    // Use mock count based on org name if no real members
    const mockOrgId = orgNameToMockId[org.name]
    const mockCount = mockOrgId ? (mockCountMap.get(mockOrgId) || 0) : 0

    return {
      ...org,
      social_links: org.social_links as Record<string, string> | null,
      member_count: hasRealMembers ? realCount : (mockCount || Math.floor(Math.random() * 8) + 4),
    }
  })

  // Return mock data if no real data exists
  if (result.length === 0) {
    return MOCK_ORGANIZATIONS
  }

  return result
}

export async function getPersonActivity(userId: string): Promise<RecentActivity[]> {
  const supabase = await createClient()

  // Fetch recent events where user is organizer
  const { data: events } = await supabase
    .from('events')
    .select('id, title, created_at, status')
    .eq('organizer_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent projects where user is author
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, created_at, status')
    .eq('author_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Combine and sort by created_at, take last 5
  const activities: RecentActivity[] = [
    ...((events || []) as any[]).map((e: any) => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      created_at: e.created_at,
      status: e.status || undefined,
    })),
    ...((projects || []) as any[]).map((p: any) => ({
      id: p.id,
      type: 'project' as const,
      title: p.title,
      created_at: p.created_at,
      status: p.status,
    })),
  ]

  const result = activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Return mock data if no real activity exists
  if (result.length === 0) {
    return MOCK_ACTIVITY.slice(0, 5)
  }

  return result
}

export async function getOrganizationMembers(orgId: string): Promise<PersonProfile[]> {
  const supabase = await createClient()

  // Query user_profiles directly since it has organization_id and role
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      full_name,
      avatar_url,
      bio,
      job_title,
      skills,
      interests,
      linkedin_url,
      visibility,
      organization_id,
      role
    `)
    .eq('organization_id', orgId)
    .order('full_name')

  // Get org details
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url, primary_color')
    .eq('id', orgId)
    .single()

  const result = ((profiles || []) as any[]).map((profile: any) => ({
    ...profile,
    organization: org ? {
      id: (org as any).id,
      name: (org as any).name,
      logo_url: (org as any).logo_url,
      primary_color: (org as any).primary_color
    } : null,
  }))

  // Return mock members if no real data exists
  if (result.length === 0) {
    return MOCK_PEOPLE.filter(p => p.organization?.id === orgId)
  }

  return result
}

