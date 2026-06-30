const pptxgen = require('pptxgenjs');

// Create a new Presentation
const pres = new pptxgen();

// Set presentation properties
pres.author = 'GoalSlider AI Team';
pres.company = 'GoalSlider AI';
pres.title = 'GoalSlider AI Project Presentation';
pres.layout = 'LAYOUT_16x9';

// Define theme colors
const themeColors = {
  primary: '3B82F6', // Blue
  secondary: 'F97316', // Orange
  dark: '0F172A', // Slate 900
  light: 'F8FAFC', // Slate 50
  text: '333333',
  textLight: '94A3B8'
};

// Slide 1: Title Slide
const slide1 = pres.addSlide();
slide1.background = { color: themeColors.dark };
slide1.addText('GoalSlider AI', {
  x: 0, y: 1.5, w: '100%', h: 1.5,
  fontSize: 64, bold: true, color: 'FFFFFF', align: 'center',
});
slide1.addText('Smart Exam & Placement Prep Planner', {
  x: 0, y: 3.0, w: '100%', h: 1,
  fontSize: 28, color: themeColors.secondary, align: 'center'
});
slide1.addText('Optimize Your Study Time with AI', {
  x: 0, y: 3.8, w: '100%', h: 1,
  fontSize: 18, color: themeColors.textLight, align: 'center'
});

// Slide 2: The Problem
const slide2 = pres.addSlide();
slide2.background = { color: 'FFFFFF' };
slide2.addText('The Problem', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: themeColors.dark, border: { type: 'bottom', pt: '2', color: themeColors.primary } });
slide2.addText([
  { text: '1. Vast Syllabi', options: { fontSize: 24, bold: true, color: themeColors.dark, breakLine: true } },
  { text: 'Students are overwhelmed by the sheer amount of material for competitive exams and placements.', options: { fontSize: 18, color: themeColors.text, bullet: true, breakLine: true } },
  { text: '\n2. Lack of Time', options: { fontSize: 24, bold: true, color: themeColors.dark, breakLine: true } },
  { text: 'Trying to study 100% of the syllabus when only 60% is needed to pass is inefficient.', options: { fontSize: 18, color: themeColors.text, bullet: true, breakLine: true } },
  { text: '\n3. Generic Plans', options: { fontSize: 24, bold: true, color: themeColors.dark, breakLine: true } },
  { text: 'Most study plans do not adapt to a student’s personal weaknesses or the actual exam weightage.', options: { fontSize: 18, color: themeColors.text, bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3.5 });

// Slide 3: The Solution (GoalSlider)
const slide3 = pres.addSlide();
slide3.background = { color: 'FFFFFF' };
slide3.addText('The Solution: GoalSlider AI', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: themeColors.dark, border: { type: 'bottom', pt: '2', color: themeColors.primary } });
slide3.addText('An intelligent platform that dynamically calculates the exact topics you need to study based on your specific target score.', { x: 0.5, y: 1.8, w: '90%', h: 1, fontSize: 22, color: themeColors.text, italic: true });
slide3.addText([
  { text: 'Dynamic "Goal Slider"', options: { fontSize: 20, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'Slide to your target score (e.g., 65%) and the AI instantly generates the shortest path to get there.', options: { fontSize: 16, color: themeColors.text, breakLine: true } },
  { text: '\nAI Recommendation Engine', options: { fontSize: 20, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'Topics are ranked by Past Year Questions (PYQ) frequency, Marks Weightage, Difficulty, and Personal Weakness.', options: { fontSize: 16, color: themeColors.text, breakLine: true } },
  { text: '\nExam Profiles', options: { fontSize: 20, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'Tailored algorithms for Government Exams (SSC, Bank) vs Campus Placements.', options: { fontSize: 16, color: themeColors.text } }
], { x: 0.5, y: 2.8, w: '90%', h: 2.5 });

// Slide 4: Key Features
const slide4 = pres.addSlide();
slide4.background = { color: 'FFFFFF' };
slide4.addText('Key Features', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: themeColors.dark, border: { type: 'bottom', pt: '2', color: themeColors.primary } });

slide4.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.8, w: 4.2, h: 1.5, fill: { color: themeColors.light }, line: { color: themeColors.primary, width: 2 } });
slide4.addText('Live Progress Tracking', { x: 0.6, y: 1.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: themeColors.dark });
slide4.addText('Track Videos, PYQs, and Practice completion per topic.', { x: 0.6, y: 2.4, w: 4.0, h: 0.5, fontSize: 14, color: themeColors.text });

slide4.addShape(pres.ShapeType.rect, { x: 5.2, y: 1.8, w: 4.2, h: 1.5, fill: { color: themeColors.light }, line: { color: themeColors.secondary, width: 2 } });
slide4.addText('Saved Study Plans', { x: 5.3, y: 1.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: themeColors.dark });
slide4.addText('Save multiple custom roadmaps and resume studying anytime.', { x: 5.3, y: 2.4, w: 4.0, h: 0.5, fontSize: 14, color: themeColors.text });

slide4.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.8, w: 4.2, h: 1.5, fill: { color: themeColors.light }, line: { color: themeColors.secondary, width: 2 } });
slide4.addText('User Dashboard', { x: 0.6, y: 3.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: themeColors.dark });
slide4.addText('Monitor your daily streaks, weekly activity, and earned badges.', { x: 0.6, y: 4.4, w: 4.0, h: 0.5, fontSize: 14, color: themeColors.text });

slide4.addShape(pres.ShapeType.rect, { x: 5.2, y: 3.8, w: 4.2, h: 1.5, fill: { color: themeColors.light }, line: { color: themeColors.primary, width: 2 } });
slide4.addText('Manual Fine-tuning', { x: 5.3, y: 3.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: themeColors.dark });
slide4.addText('Force include or exclude specific topics from the AI recommendations.', { x: 5.3, y: 4.4, w: 4.0, h: 0.5, fontSize: 14, color: themeColors.text });

// Slide 5: Tech Stack
const slide5 = pres.addSlide();
slide5.background = { color: themeColors.dark };
slide5.addText('Technology Stack', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: 'FFFFFF', border: { type: 'bottom', pt: '2', color: themeColors.secondary } });
slide5.addText([
  { text: 'Frontend', options: { fontSize: 24, bold: true, color: themeColors.primary, breakLine: true } },
  { text: 'React.js (Next.js App Router)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: 'Tailwind CSS (for responsive, glassmorphic UI)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: 'Framer Motion (for smooth micro-animations)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: 'Recharts (for progress data visualization)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: '\nBackend & Database', options: { fontSize: 24, bold: true, color: themeColors.secondary, breakLine: true } },
  { text: 'Supabase (PostgreSQL)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: 'Supabase Auth (Secure User Authentication)', options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true } },
  { text: 'Row Level Security (RLS) for data privacy', options: { fontSize: 18, color: 'FFFFFF', bullet: true } },
], { x: 0.5, y: 1.8, w: '90%', h: 3.5 });

// Slide 6: Database Architecture
const slide6 = pres.addSlide();
slide6.background = { color: 'FFFFFF' };
slide6.addText('Database Architecture', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: themeColors.dark, border: { type: 'bottom', pt: '2', color: themeColors.primary } });
slide6.addText('Relational schema hosted on Supabase (PostgreSQL):', { x: 0.5, y: 1.6, w: '90%', h: 0.5, fontSize: 18, color: themeColors.text });

slide6.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.3, w: 2.8, h: 2, fill: { color: themeColors.dark }, align: 'center' });
slide6.addText('users (auth)', { x: 0.5, y: 3.1, w: 2.8, h: 0.5, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center' });

slide6.addShape(pres.ShapeType.rect, { x: 3.8, y: 2.3, w: 2.8, h: 2, fill: { color: themeColors.primary }, align: 'center' });
slide6.addText('study_plans', { x: 3.8, y: 3.1, w: 2.8, h: 0.5, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center' });

slide6.addShape(pres.ShapeType.rect, { x: 7.1, y: 2.3, w: 2.8, h: 2, fill: { color: themeColors.secondary }, align: 'center' });
slide6.addText('student_progress', { x: 7.1, y: 3.1, w: 2.8, h: 0.5, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center' });

slide6.addText('users.id -> study_plans.student_id', { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 14, color: themeColors.textLight });
slide6.addText('study_plans.id -> student_progress.plan_id', { x: 0.5, y: 4.8, w: 9, h: 0.5, fontSize: 14, color: themeColors.textLight });

// Slide 7: Future Scope
const slide7 = pres.addSlide();
slide7.background = { color: 'FFFFFF' };
slide7.addText('Future Enhancements', { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: themeColors.dark, border: { type: 'bottom', pt: '2', color: themeColors.primary } });
slide7.addText([
  { text: 'Interactive AI Tutor', options: { fontSize: 24, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'A floating chat assistant to resolve doubts in real-time.', options: { fontSize: 18, color: themeColors.text, breakLine: true } },
  { text: '\nMock Test Engine', options: { fontSize: 24, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'Automated quizzes targeting the specific AI-recommended topics.', options: { fontSize: 18, color: themeColors.text, breakLine: true } },
  { text: '\nLeaderboards & Gamification', options: { fontSize: 24, bold: true, color: themeColors.primary, bullet: true, breakLine: true } },
  { text: 'Global ranking system to boost student motivation and retention.', options: { fontSize: 18, color: themeColors.text } }
], { x: 0.5, y: 1.8, w: '90%', h: 3.5 });

// Slide 8: Thank You
const slide8 = pres.addSlide();
slide8.background = { color: themeColors.dark };
slide8.addText('Thank You!', {
  x: 0, y: 2.0, w: '100%', h: 1.5,
  fontSize: 64, bold: true, color: 'FFFFFF', align: 'center',
});
slide8.addText('GoalSlider AI Project', {
  x: 0, y: 3.5, w: '100%', h: 1,
  fontSize: 24, color: themeColors.primary, align: 'center'
});

// Save the Presentation
pres.writeFile({ fileName: 'GoalSlider_AI_Project_Presentation.pptx' })
  .then(fileName => {
    console.log(`Presentation saved successfully: ${fileName}`);
  })
  .catch(err => {
    console.error('Error saving presentation:', err);
  });
