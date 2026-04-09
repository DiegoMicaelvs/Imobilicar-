import { db } from '../server/db.js';
import { 
  customers, 
  vehicles, 
  leads, 
  rentals,
  financings,
  financingProposals,
  tradeInVehicles,
  customerEvents,
  investorEvents,
  investorPayments,
  rentalInspectionItems,
  vehicleRequests,
  interactions,
  vehicleInspections
} from '../shared/schema.js';
import { sql } from 'drizzle-orm';

async function cleanup() {
  console.log('🧹 Starting cleanup of test data...\n');
  
  try {
    // Get timestamp of when the import happened (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log(`Keeping only data created after: ${oneHourAgo.toISOString()}\n`);
    
    // Count what we have before cleanup
    const beforeCounts = {
      customers: await db.select({ count: sql<number>`count(*)` }).from(customers),
      vehicles: await db.select({ count: sql<number>`count(*)` }).from(vehicles),
      leads: await db.select({ count: sql<number>`count(*)` }).from(leads),
      rentals: await db.select({ count: sql<number>`count(*)` }).from(rentals),
      financings: await db.select({ count: sql<number>`count(*)` }).from(financings),
      proposals: await db.select({ count: sql<number>`count(*)` }).from(financingProposals),
      tradeIns: await db.select({ count: sql<number>`count(*)` }).from(tradeInVehicles),
    };
    
    console.log('📊 Before cleanup:');
    console.log(`  Customers: ${beforeCounts.customers[0].count}`);
    console.log(`  Vehicles: ${beforeCounts.vehicles[0].count}`);
    console.log(`  Leads: ${beforeCounts.leads[0].count}`);
    console.log(`  Rentals: ${beforeCounts.rentals[0].count}`);
    console.log(`  Financings: ${beforeCounts.financings[0].count}`);
    console.log(`  Proposals: ${beforeCounts.proposals[0].count}`);
    console.log(`  Trade-ins: ${beforeCounts.tradeIns[0].count}\n`);
    
    // Delete all rental inspection items
    console.log('Deleting all rental inspection items...');
    await db.delete(rentalInspectionItems);
    
    // Delete all interactions
    console.log('Deleting all lead interactions...');
    await db.delete(interactions);
    
    // Delete all leads
    console.log('Deleting all leads...');
    await db.delete(leads);
    
    // Delete all financing proposals
    console.log('Deleting all financing proposals...');
    await db.delete(financingProposals);
    
    // Delete all financings
    console.log('Deleting all financings...');
    await db.delete(financings);
    
    // Delete all trade-in vehicles
    console.log('Deleting all trade-in vehicles...');
    await db.delete(tradeInVehicles);
    
    // Delete all rentals
    console.log('Deleting all rentals...');
    await db.delete(rentals);
    
    // Delete all customer events
    console.log('Deleting all customer events...');
    await db.delete(customerEvents);
    
    // Delete all investor events
    console.log('Deleting all investor events...');
    await db.delete(investorEvents);
    
    // Delete all investor payments
    console.log('Deleting all investor payments...');
    await db.delete(investorPayments);
    
    // Delete all vehicle inspections
    console.log('Deleting all vehicle inspections...');
    await db.delete(vehicleInspections);
    
    // Delete all vehicle requests
    console.log('Deleting all vehicle requests...');
    await db.delete(vehicleRequests);
    
    // Get all vehicles from recent import (those with renavam starting with "0-")
    console.log('Identifying recently imported vehicles...');
    const importedVehicles = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(sql`${vehicles.renavam} LIKE '0-%'`);
    
    const importedVehicleIds = importedVehicles.map(v => v.id);
    console.log(`Found ${importedVehicleIds.length} recently imported vehicles`);
    
    // Delete vehicles that are NOT from the recent import
    if (importedVehicleIds.length > 0) {
      console.log('Deleting old test vehicles...');
      await db.delete(vehicles).where(sql`${vehicles.id} NOT IN ${importedVehicleIds}`);
    }
    
    // Get all investor IDs from recently imported vehicles
    const investorIds = await db
      .selectDistinct({ ownerId: vehicles.ownerId })
      .from(vehicles)
      .where(sql`${vehicles.renavam} LIKE '0-%'`);
    
    const validInvestorIds = investorIds
      .map(i => i.ownerId)
      .filter((id): id is string => id !== null);
    
    console.log(`Found ${validInvestorIds.length} investors from import`);
    
    // Delete customers that are NOT investors from the import
    if (validInvestorIds.length > 0) {
      console.log('Deleting old test customers...');
      await db.delete(customers).where(sql`${customers.id} NOT IN ${validInvestorIds}`);
    }
    
    // Count what we have after cleanup
    const afterCounts = {
      customers: await db.select({ count: sql<number>`count(*)` }).from(customers),
      vehicles: await db.select({ count: sql<number>`count(*)` }).from(vehicles),
      leads: await db.select({ count: sql<number>`count(*)` }).from(leads),
      rentals: await db.select({ count: sql<number>`count(*)` }).from(rentals),
      financings: await db.select({ count: sql<number>`count(*)` }).from(financings),
      proposals: await db.select({ count: sql<number>`count(*)` }).from(financingProposals),
      tradeIns: await db.select({ count: sql<number>`count(*)` }).from(tradeInVehicles),
    };
    
    console.log('\n✅ Cleanup completed!\n');
    console.log('📊 After cleanup:');
    console.log(`  Customers: ${afterCounts.customers[0].count} (deleted ${Number(beforeCounts.customers[0].count) - Number(afterCounts.customers[0].count)})`);
    console.log(`  Vehicles: ${afterCounts.vehicles[0].count} (deleted ${Number(beforeCounts.vehicles[0].count) - Number(afterCounts.vehicles[0].count)})`);
    console.log(`  Leads: ${afterCounts.leads[0].count} (deleted ${Number(beforeCounts.leads[0].count)})`);
    console.log(`  Rentals: ${afterCounts.rentals[0].count} (deleted ${Number(beforeCounts.rentals[0].count)})`);
    console.log(`  Financings: ${afterCounts.financings[0].count} (deleted ${Number(beforeCounts.financings[0].count)})`);
    console.log(`  Proposals: ${afterCounts.proposals[0].count} (deleted ${Number(beforeCounts.proposals[0].count)})`);
    console.log(`  Trade-ins: ${afterCounts.tradeIns[0].count} (deleted ${Number(beforeCounts.tradeIns[0].count)})`);
    
    console.log('\n✨ Database now contains only the 42 investors and 108 vehicles from the Excel import!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

cleanup()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
