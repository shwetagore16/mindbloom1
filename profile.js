document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be initialized before loading profile data
    if (window.ensureSupabase) {
        await window.ensureSupabase();
    }
    // Debug: check Supabase session
    if (window.getCurrentUser) {
        const user = await window.getCurrentUser();
        console.log('Supabase current user at page load:', user);
    }
    // Load profile data FIRST so actual user info is shown
    loadProfileData();

    // Debug: log user object from localStorage
    const debugUser = localStorage.getItem('mindbloom_user');
    console.log('DEBUG mindbloom_user:', debugUser);

    // DOM Elements
    const profileWelcome = document.getElementById('profile-welcome');
    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    const inputName = document.getElementById('input-name');
    const inputEmail = document.getElementById('input-email');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileCard = document.querySelector('.profile-card');
    const toast = document.getElementById('toast-notification');
    // Stats Elements
    const plantStageEl = document.getElementById('stat-plant-stage');
    const journalEntriesEl = document.getElementById('stat-journal-entries');
    const moodEntriesEl = document.getElementById('stat-mood-entries');

    // Ensure display fields are visible on load (unless in edit mode)
    if (displayName) displayName.classList.remove('hidden');
    if (displayEmail) displayEmail.classList.remove('hidden');
    if (displayName) displayName.style.border = '';

    // ... rest of your logic remains unchanged ...

    let isEditMode = false;

    // --- Data Loading and Display ---

    async function loadProfileData() {
        let supabaseUser = null;
        let userInfo = null;
        let email = '';
        let username = '';
        try {
            console.log('=== PROFILE DEBUG START ===');
            console.log('window.getCurrentUser exists:', !!window.getCurrentUser);
            if (window.getCurrentUser) {
                supabaseUser = await window.getCurrentUser();
                console.log('supabaseUser from getCurrentUser:', supabaseUser);
                email = supabaseUser?.email || '';
                console.log('email extracted:', email);
            }
            console.log('=== PROFILE DEBUG END ===');
            if (!email) {
                console.warn('No email found, would redirect to login');
                // TEMPORARILY DISABLED: window.location.href = 'login.html';
                // return;
                // Show debug info instead
                if (profileWelcome) profileWelcome.textContent = 'DEBUG: No email found!';
                if (displayName) displayName.textContent = 'Not logged in';
                if (displayEmail) displayEmail.textContent = 'No session';
                return;
            }
            // Try to fetch from Users table
            if (window.supabase && email) {
                const { data, error } = await window.supabase
                    .from('Users')
                    .select('Username, email')
                    .eq('email', email)
                    .single();
                if (error || !data) {
                    console.log('User not found in Users table, using email as fallback:', error);
                    // Use email as fallback if not found in Users table
                    username = email.split('@')[0]; // Use part before @ as username
                } else {
                    userInfo = data;
                    username = userInfo.Username || email.split('@')[0];
                    email = userInfo.email || email;
                }
            } else {
                // Fallback if no Supabase or email
                username = email ? email.split('@')[0] : 'User';
            }
        } catch (e) {
            console.error('Error loading profile:', e);
            // Still show profile with email fallback
            username = email ? email.split('@')[0] : 'User';
        }
        // Show name and email (always show something)
        if (profileWelcome) profileWelcome.textContent = `Hello, ${username}!`;
        if (displayName) displayName.textContent = username;
        if (displayEmail) displayEmail.textContent = email;

        // Update new header fields
        const displayNameHeader = document.getElementById('display-name-header');
        const displayEmailHeader = document.getElementById('display-email-header');
        if (displayNameHeader) displayNameHeader.textContent = username;
        if (displayEmailHeader) displayEmailHeader.textContent = email;
        // Load and display stats
        loadStats();
    }

    function loadStats() {
        // Plant Stage
        const plantData = JSON.parse(localStorage.getItem('mindbloom_plantData')) || { xp: 0 };
        const plantStages = [
            { emoji: '\ud83c\udf31', name: 'Seedling', minXp: 0 },
            { emoji: '\ud83c\udf3f', name: 'Herb', minXp: 10 },
            { emoji: '\ud83c\udf38', name: 'Cherry Blossom', minXp: 30 },
            { emoji: '\ud83c\udf3a', name: 'Hibiscus', minXp: 60 },
            { emoji: '\ud83c\udf3b', name: 'Sunflower', minXp: 100 }
        ];
        const currentStage = plantStages.slice().reverse().find(stage => plantData.xp >= stage.minXp);
        if (plantStageEl) plantStageEl.textContent = `${currentStage.emoji} ${currentStage.name}`;

        // Journal Entries
        const journalEntries = JSON.parse(localStorage.getItem('mindbloom_journalEntries')) || [];
        if (journalEntriesEl) journalEntriesEl.textContent = journalEntries.length;

        // Mood Entries
        const moodEntries = JSON.parse(localStorage.getItem('mindbloom_moodHistory')) || [];
        if (moodEntriesEl) moodEntriesEl.textContent = moodEntries.length;
    }

    // --- Edit Mode ---

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            toggleEditMode();
        });
    }

    function toggleEditMode() {
        if (!profileCard || !displayName || !displayEmail || !inputName || !inputEmail || !editProfileBtn) return;

        profileCard.classList.toggle('edit-mode', isEditMode);

        if (isEditMode) {
            // Enter edit mode
            displayName.classList.add('hidden');
            displayEmail.classList.add('hidden');
            inputName.classList.remove('hidden');
            inputEmail.classList.remove('hidden');

            inputName.value = displayName.textContent;
            inputEmail.value = displayEmail.textContent;

            editProfileBtn.textContent = 'Save Changes';
        } else {
            // Save changes and exit edit mode
            (async () => {
                editProfileBtn.classList.add('loading');

                let user = {};
                try {
                    user = JSON.parse(localStorage.getItem('mindbloom_user')) || {};
                } catch (e) {
                    user = {};
                }
                if (inputName) user.name = inputName.value.trim();
                if (inputEmail) user.email = inputEmail.value.trim();

                localStorage.setItem('mindbloom_user', JSON.stringify(user));

                // Update display
                if (displayName) displayName.textContent = user.name || '';
                if (displayEmail) displayEmail.textContent = user.email || '';
                if (profileWelcome) profileWelcome.textContent = `Hello, ${user.name || ''}!`;

                try {
                    if (window.ensureSupabase && window.getCurrentUser) {
                        const supabase = await window.ensureSupabase();
                        const supabaseUser = await window.getCurrentUser();
                        if (supabase && supabaseUser) {
                            const { data, error } = await supabase.auth.updateUser({
                                data: {
                                    display_name: user.name || ''
                                }
                            });
                            if (error) throw error;
                            console.log('Supabase updateUser success:', data);
                        }
                    }
                    showToast('Profile updated successfully!');
                } catch (error) {
                    console.error('Error updating profile:', error);
                    showToast('Error updating profile. Please try again.');
                } finally {
                    // Toggle visibility
                    displayName.classList.remove('hidden');
                    displayEmail.classList.remove('hidden');
                    inputName.classList.add('hidden');
                    inputEmail.classList.add('hidden');

                    editProfileBtn.classList.remove('loading');
                    editProfileBtn.textContent = 'Edit Profile';
                }
            })();
        }
    }

    // --- Helper Functions ---
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- Recent Activity ---
    function loadRecentActivity() {
        const recentMoodsList = document.getElementById('recent-moods-list');
        const recentJournalsList = document.getElementById('recent-journals-list');

        if (!recentMoodsList || !recentJournalsList) return;

        // Load recent moods
        const moodEntries = JSON.parse(localStorage.getItem('mindbloom_moodHistory')) || [];
        const recentMoods = moodEntries.slice(-3).reverse(); // Get last 3
        recentMoodsList.innerHTML = recentMoods.map(entry => `
            <div class="entry-item">
                <span>${entry.mood} - ${entry.notes}</span>
                <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
            </div>
        `).join('');

        // Load recent journal entries
        const journalEntries = JSON.parse(localStorage.getItem('mindbloom_journalEntries')) || [];
        const recentJournals = journalEntries.slice(-3).reverse(); // Get last 3
        recentJournalsList.innerHTML = recentJournals.map(entry => `
            <div class="entry-item">
                <span>${entry.content.substring(0, 50)}...</span>
                <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
            </div>
        `).join('');

        if (recentMoods.length === 0) {
            recentMoodsList.innerHTML = '<p>No recent mood entries.</p>';
        }

        if (recentJournals.length === 0) {
            recentJournalsList.innerHTML = '<p>No recent journal entries.</p>';
        }
    }

    // --- Logout Functionality ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        // Remove all relevant keys
        localStorage.removeItem('mindbloom_user');
        localStorage.removeItem('mindbloom_loggedIn');
        // Optionally clear other session data if needed
        window.location.href = 'login.html';
    });

    // --- Initial Load ---
    loadProfileData();
    loadRecentActivity();
});
