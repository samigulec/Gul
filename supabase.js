import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getUserStats(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user stats:', error);
        return null;
    }

    return data;
}

export async function upsertUserStats(userId, stats) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_stats')
        .upsert({
            user_id: userId,
            username: stats.username || '',
            pfp_url: stats.pfp_url || '',
            total_spins: stats.total_spins || 0,
            total_wins: stats.total_wins || 0,
            total_usdc: stats.total_usdc || 0,
            total_points: stats.total_points || 0
        }, {
            onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error upserting user stats:', error);
        return null;
    }

    return data;
}

export async function recordSpin(userId, spinResult) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('spin_history')
        .insert({
            user_id: userId,
            result_type: spinResult.isWin ? 'win' : 'loss',
            amount: spinResult.amount || 0,
            segment_name: spinResult.segmentName || '',
            points_earned: spinResult.points || 0
        })
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error recording spin:', error);
        return null;
    }

    return data;
}

export async function getSpinHistory(userId, limit = 20) {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('spin_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching spin history:', error);
        return [];
    }

    return data || [];
}

export async function syncLocalToDatabase(userId, localStats, username = '', pfpUrl = '') {
    if (!userId) return null;

    const existingStats = await getUserStats(userId);

    if (existingStats) {
        const merged = {
            username: username || existingStats.username,
            pfp_url: pfpUrl || existingStats.pfp_url,
            total_spins: Math.max(existingStats.total_spins, localStats.totalSpins || 0),
            total_wins: Math.max(existingStats.total_wins, localStats.totalWins || 0),
            total_usdc: Math.max(parseFloat(existingStats.total_usdc), localStats.totalWinnings || 0),
            total_points: Math.max(existingStats.total_points, localStats.totalPoints || 0)
        };
        return await upsertUserStats(userId, merged);
    }

    return await upsertUserStats(userId, {
        username,
        pfp_url: pfpUrl,
        total_spins: localStats.totalSpins || 0,
        total_wins: localStats.totalWins || 0,
        total_usdc: localStats.totalWinnings || 0,
        total_points: localStats.totalPoints || 0
    });
}

export async function incrementStats(userId, spinResult) {
    if (!userId) return null;

    const existingStats = await getUserStats(userId);

    if (!existingStats) {
        return await upsertUserStats(userId, {
            total_spins: 1,
            total_wins: spinResult.isWin ? 1 : 0,
            total_usdc: spinResult.amount || 0,
            total_points: spinResult.points || 0
        });
    }

    const updated = {
        username: existingStats.username,
        pfp_url: existingStats.pfp_url,
        total_spins: existingStats.total_spins + 1,
        total_wins: existingStats.total_wins + (spinResult.isWin ? 1 : 0),
        total_usdc: parseFloat(existingStats.total_usdc) + (spinResult.amount || 0),
        total_points: existingStats.total_points + (spinResult.points || 0)
    };

    return await upsertUserStats(userId, updated);
}
