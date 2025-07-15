import { CSVUserParserService, JSONUserParserService, PlainTextParserService } from "@neon/parsers";
import { IUser, UserService } from "@neon/users";
import { VectorStoreService } from "@neon/vector-store";
import { NextRequest, NextResponse } from "next/server";

const userService = new UserService();

export async function POST(request: NextRequest) {
  try {
    console.log("Starting user sync process...");

    await VectorStoreService.initialize();

    const results = {
      plainText: 0,
      json: 0,
      csv: 0,
      total: 0,
    };

    try {
      const textFiles = await PlainTextParserService.readTextFiles("static-data/users/plain-text");

      await Promise.all(
        textFiles.map(async (file) => {
          try {
            console.log(`Processing text file: ${file.filename}`);
            const extractedUser: IUser = await userService.extractUserFromPlainText(file.content);
            extractedUser.description = file.content;

            const savedUser = await userService.saveUser(extractedUser);
            if (savedUser) {
              console.log(`User saved from ${file.filename}, user ID: ${savedUser.uuid} user name: ${savedUser.name}`);
              results.plainText++;
            }
          } catch (error: any) {
            console.error(`Error processing ${file.filename}:`, error?.message);
          }
        })
      );
    } catch (error) {
      console.error("Error processing plain text files:", error);
    }

    // 2. Process JSON Files
    try {
      const jsonUsers: IUser[] = await JSONUserParserService.parseJSONFiles("static-data/users/json");
      const savedJsonUsers = await userService.saveUsers(jsonUsers);
      results.json = savedJsonUsers.length;
    } catch (error: any) {
      console.error("Error processing JSON files:", error?.message);
    }

    // 3. Process CSV Files
    try {
      const csvUsers: IUser[] = await CSVUserParserService.parseCSVFiles("static-data/users/csv");
      const savedCsvUsers = await userService.saveUsers(csvUsers);
      results.csv = savedCsvUsers.length;
    } catch (error: any) {
      console.error("Error processing CSV files:", error?.message);
    }

    results.total = results.plainText + results.json + results.csv;

    console.log("User sync completed:", results);

    return NextResponse.json({
      success: true,
      message: "Users synced successfully",
      results,
    });
  } catch (error: any) {
    console.error("Error in user sync:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const allUsers: IUser[] = await userService.getAllUsers();
    const stats = await VectorStoreService.getStats();

    return NextResponse.json({
      success: true,
      users: allUsers,
      stats,
    });
  } catch (error: any) {
    console.error("Error getting users:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
