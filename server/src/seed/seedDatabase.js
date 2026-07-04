import {
  Exam,
  Course,
  CurrentAffair,
  RevisionCapsule,
  VocabularyWord,
  Question,
  Test,
  TestSeries,
  User,
  Reward,
  Mentor,
  LiveClass,
  StudentProfile,
} from '../models/index.js';
import {
  exams,
  courses,
  currentAffairs,
  revisionCapsules,
  vocabularyWords,
  sampleQuestions,
  testQuestions,
  tests,
  testSeries,
  seedMentorUser,
  seedE2eStudentUser,
  seedE2ePaywallStudentUser,
  rewards,
  mentorProfile,
  liveClasses,
} from './data.js';
import { getSeedAdminUser } from './adminConfig.js';

async function resolveAdminPhone(seedAdmin, excludeUserId) {
  const candidates = [
    seedAdmin.phone,
    `9${seedAdmin.email.replace(/\D/g, '').slice(-9).padStart(9, '0')}`.slice(0, 10),
    `9${Date.now().toString().slice(-9)}`,
  ];

  for (const phone of candidates) {
    const query = { phone };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    const taken = await User.findOne(query).select('_id').lean();
    if (!taken) {
      return phone;
    }
  }

  throw new Error('Could not allocate a unique phone for the admin user');
}

export async function ensureAdminUser() {
  const seedAdmin = getSeedAdminUser();
  let adminUser = await User.findOne({ email: seedAdmin.email });

  if (!adminUser) {
    const phone = await resolveAdminPhone(seedAdmin);

    adminUser = new User({
      name: seedAdmin.name,
      email: seedAdmin.email,
      phone,
      role: seedAdmin.role,
      isPremium: true,
      premiumPlan: 'yearly',
    });
  } else {
    adminUser.name = seedAdmin.name;
    adminUser.role = seedAdmin.role;
    adminUser.isPremium = true;
    adminUser.premiumPlan = adminUser.premiumPlan ?? 'yearly';

    const phoneTaken = await User.findOne({
      phone: seedAdmin.phone,
      _id: { $ne: adminUser._id },
    })
      .select('_id')
      .lean();

    if (!phoneTaken) {
      adminUser.phone = seedAdmin.phone;
    }
  }

  await adminUser.setPassword(seedAdmin.password);
  await adminUser.save();
  return adminUser;
}

/** Dev/student app login — student@sopaan.dev (see seedE2eStudentUser). */
export async function ensureDevStudentUser() {
  return ensureSeedUser(seedE2eStudentUser);
}

async function ensureSeedUser(seedUser, { coins, premiumTrialUsed, privacyConsent } = {}) {
  let user = await User.findOne({ email: seedUser.email });

  if (!user) {
    user = new User({
      name: seedUser.name,
      email: seedUser.email,
      phone: seedUser.phone,
      role: seedUser.role,
      coins: coins ?? seedUser.coins ?? 0,
      premiumTrialUsed: premiumTrialUsed ?? seedUser.premiumTrialUsed ?? false,
      privacyConsent: privacyConsent ?? seedUser.privacyConsent,
    });
    await user.setPassword(seedUser.password);
    await user.save();
  } else if (coins != null || premiumTrialUsed != null) {
    if (coins != null) user.coins = coins;
    if (premiumTrialUsed != null) user.premiumTrialUsed = premiumTrialUsed;
    if (privacyConsent) user.privacyConsent = privacyConsent;
    await user.save();
  }

  if (seedUser.profile) {
    await StudentProfile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, ...seedUser.profile },
      { upsert: true, new: true },
    );
  }

  return user;
}

export async function seedDatabase() {
  console.log('[seed] Clearing existing content collections...');

  await Promise.all([
    Exam.deleteMany({}),
    Course.deleteMany({}),
    CurrentAffair.deleteMany({}),
    RevisionCapsule.deleteMany({}),
    VocabularyWord.deleteMany({}),
    Question.deleteMany({}),
    Test.deleteMany({}),
    TestSeries.deleteMany({}),
    Reward.deleteMany({}),
    Mentor.deleteMany({}),
    LiveClass.deleteMany({}),
  ]);

  console.log('[seed] Ensuring seed admin user...');
  const seedAdmin = getSeedAdminUser();
  const adminUser = await ensureAdminUser();

  console.log('[seed] Inserting exams...');
  const insertedExams = await Exam.insertMany(exams);

  console.log('[seed] Inserting courses...');
  const insertedCourses = await Course.insertMany(
    courses.map((course) => ({
      ...course,
      status: 'published',
      createdBy: adminUser._id,
    })),
  );

  console.log('[seed] Inserting questions...');
  const insertedQuestions = await Question.insertMany([...sampleQuestions, ...testQuestions]);

  console.log('[seed] Inserting tests...');
  const testQuestionIds = insertedQuestions.slice(sampleQuestions.length).map((q) => q._id);
  const testsWithQuestions = tests.map((test, index) => ({
    ...test,
    createdBy: adminUser._id,
    questions:
      index === 0
        ? testQuestionIds.slice(0, 2)
        : index === 1
          ? testQuestionIds
          : testQuestionIds.slice(2, 3),
  }));
  const insertedTests = await Test.insertMany(testsWithQuestions);

  console.log('[seed] Inserting test series...');
  const seriesWithMocks = testSeries.map((series) => ({
    ...series,
    mocks: series.mocks.map((mock, mockIndex) => ({
      ...mock,
      testId: insertedTests[mock.testIndex ?? mockIndex]?._id ?? insertedTests[0]._id,
    })),
  }));
  const insertedSeries = await TestSeries.insertMany(seriesWithMocks);

  console.log('[seed] Inserting current affairs...');
  const affairsWithQuiz = currentAffairs.map((affair, index) => ({
    ...affair,
    status: 'published',
    createdBy: adminUser._id,
    quizQuestions: index === 0 ? [insertedQuestions[0]._id] : [],
  }));
  const insertedAffairs = await CurrentAffair.insertMany(affairsWithQuiz);

  console.log('[seed] Inserting revision capsules...');
  const insertedCapsules = await RevisionCapsule.insertMany(
    revisionCapsules.map((capsule) => ({
      ...capsule,
      status: 'published',
      createdBy: adminUser._id,
    })),
  );

  console.log('[seed] Inserting vocabulary words...');
  const insertedVocabulary = await VocabularyWord.insertMany(vocabularyWords);

  console.log('[seed] Ensuring seed mentor user...');
  let mentorUser = await User.findOne({ email: seedMentorUser.email });

  if (!mentorUser) {
    mentorUser = new User({
      name: seedMentorUser.name,
      email: seedMentorUser.email,
      phone: seedMentorUser.phone,
      role: seedMentorUser.role,
    });
    await mentorUser.setPassword(seedMentorUser.password);
    await mentorUser.save();
  }

  console.log('[seed] Ensuring E2E student users...');
  const e2eStudent = await ensureSeedUser(seedE2eStudentUser);
  const e2ePaywallStudent = await ensureSeedUser(seedE2ePaywallStudentUser);

  console.log('[seed] Inserting rewards...');
  const insertedRewards = await Reward.insertMany(rewards);

  console.log('[seed] Inserting mentors...');
  await Mentor.create({
    userId: mentorUser._id,
    ...mentorProfile,
  });

  console.log('[seed] Inserting live classes...');
  const insertedLiveClasses = await LiveClass.insertMany(
    liveClasses.map((item) => ({
      ...item,
      createdBy: adminUser._id,
      instructorId: mentorUser._id,
    })),
  );

  return {
    exams: insertedExams.length,
    courses: insertedCourses.length,
    currentAffairs: insertedAffairs.length,
    revisionCapsules: insertedCapsules.length,
    vocabularyWords: insertedVocabulary.length,
    questions: insertedQuestions.length,
    tests: insertedTests.length,
    testSeries: insertedSeries.length,
    rewards: insertedRewards.length,
    mentors: 1,
    liveClasses: insertedLiveClasses.length,
    adminEmail: seedAdmin.email,
    mentorEmail: seedMentorUser.email,
    e2eStudentEmail: e2eStudent.email,
    e2ePaywallStudentEmail: e2ePaywallStudent.email,
  };
}
