/**
 * Database Migration Script: sync-plan-tiers.js
 * Synchronizes existing tenants with the new tiered capacity architecture.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { plans: configPlans } = require('../src/config/plans');

async function syncTiers() {
    try {
        const mongoUri = process.env.MASTER_DB_URI || 'mongodb://127.0.0.1:27017/workflow_master';
        const conn = await mongoose.createConnection(mongoUri).asPromise();
        console.log('✅ Connected to Master DB');

        const Tenant = require('../src/models/master/Tenant')(conn);
        const Plan = require('../src/models/master/Plan')(conn); // Fixed path

        const tenants = await Tenant.find({});
        console.log(`🔍 Found ${tenants.length} tenants to synchronize...`);

        for (const tenant of tenants) {
            let planCode = tenant.planDetails?.code || 'STARTER';
            
            // Try to find the matching plan in config
            const freshPlan = configPlans.find(p => p.code === planCode) || configPlans[1]; // Fallback to Starter

            console.log(`🔄 Updating Tenant: ${tenant.name} (${tenant.domain}) -> Plan: ${freshPlan.name}`);

            tenant.planDetails = {
                name: freshPlan.name,
                code: freshPlan.code,
                price: freshPlan.price,
                currency: freshPlan.currency || 'D',
                features: freshPlan.features
            };

            await tenant.save();
        }

        console.log('\n✨ All tenants synchronized with the new capacity matrix.');
        await conn.close();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

syncTiers();
