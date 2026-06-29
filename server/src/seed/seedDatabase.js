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
  seedAdminUser,
  seedMentorUser,
  seedE2eStudentUser,
  seedE2ePaywallStudentUser,
  rewards,
  mentorProfile,
  liveClasses,
} from './data.js';

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
  let adminUser = await User.findOne({ email: seedAdminUser.email });

  if (!adminUser) {
    adminUser = new User({
      name: seedAdminUser.name,
      email: seedAdminUser.email,
      phone: seedAdminUser.phone,
      role: seedAdminUser.role,
    });
    await adminUser.setPassword(seedAdminUser.password);
    await adminUser.save();
  }

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
    adminEmail: seedAdminUser.email,
    mentorEmail: seedMentorUser.email,
    e2eStudentEmail: e2eStudent.email,
    e2ePaywallStudentEmail: e2ePaywallStudent.email,
  };
}
