import { supabase } from '../utils/supabaseClient';

// Fetch active ads for a specific placement ('home_banner', 'feed_card', 'task_detail')
export async function fetchActiveAds(placement = null) {
  try {
    let query = supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (placement) {
      query = query.eq('placement', placement);
    }

    const { data, error } = await query;
    if (error) {
      console.error('fetchActiveAds error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('fetchActiveAds exception:', err);
    return [];
  }
}

// Record an ad impression (increment view count)
export async function recordAdImpression(adId) {
  if (!adId) return;
  try {
    const { data } = await supabase
      .from('ads')
      .select('impressions')
      .eq('id', adId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('ads')
        .update({ impressions: (data.impressions || 0) + 1 })
        .eq('id', adId);
    }
  } catch (err) {
    console.error('recordAdImpression error:', err);
  }
}

// Record an ad click (increment click count)
export async function recordAdClick(adId) {
  if (!adId) return;
  try {
    const { data } = await supabase
      .from('ads')
      .select('clicks')
      .eq('id', adId)
      .maybeSingle();

    if (data) {
      await supabase
        .from('ads')
        .update({ clicks: (data.clicks || 0) + 1 })
        .eq('id', adId);
    }
  } catch (err) {
    console.error('recordAdClick error:', err);
  }
}

// Admin: Fetch all ads
export async function fetchAllAds() {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchAllAds error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('fetchAllAds exception:', err);
    return [];
  }
}

// Admin: Create new custom or provider ad
export async function createAd(adData) {
  try {
    const payload = {
      title: adData.title,
      advertiser: adData.advertiser || 'Sponsor',
      provider: adData.provider || 'custom',
      placement: adData.placement || 'home_banner',
      cta_text: adData.ctaText || 'Learn More',
      badge_text: adData.badgeText || 'SPONSORED',
      is_active: adData.isActive !== false,
      weight: Number(adData.weight || 1),
    };

    if (adData.provider === 'custom') {
      payload.image_url = adData.imageUrl;
      payload.target_url = adData.targetUrl || '/post';
    } else if (adData.provider === 'google_adsense') {
      payload.adsense_client_id = adData.adsenseClientId;
      payload.adsense_slot_id = adData.adsenseSlotId;
      payload.image_url = adData.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    } else if (adData.provider === 'html_embed') {
      payload.html_code = adData.htmlCode;
    }

    const { data, error } = await supabase
      .from('ads')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createAd error:', err);
    return null;
  }
}

// Admin: Toggle ad active state
export async function toggleAdActive(adId, isActive) {
  try {
    const { data, error } = await supabase
      .from('ads')
      .update({ is_active: isActive })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('toggleAdActive error:', err);
    return null;
  }
}

// Admin: Delete ad
export async function deleteAd(adId) {
  try {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteAd error:', err);
    return false;
  }
}
