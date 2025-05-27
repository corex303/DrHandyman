"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var servicesToSeed, _i, servicesToSeed_1, serviceData, service, adminPassword, adminUser, maintenancePassword, maintenanceUser, oldWorker, error_1, siteSettings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Start seeding ...");
                    servicesToSeed = [
                        { name: "Carpentry", description: "Expert carpentry services for repairs, installations, and custom work.", slug: "carpentry" },
                        { name: "Concrete Repair", description: "Professional concrete repair for driveways, patios, and foundations.", slug: "concrete-repair" },
                        { name: "Deck Building / Repair", description: "Custom deck building and repair services to enhance your outdoor space.", slug: "deck-building-repair" },
                        { name: "Flooring Installation", description: "Installation of various flooring types including hardwood, laminate, and tile.", slug: "flooring-installation" },
                        { name: "Interior / Exterior Painting", description: "High-quality interior and exterior painting services.", slug: "interior-exterior-painting" },
                        { name: "Plumbing Repairs", description: "Reliable plumbing repair services for leaks, clogs, and installations.", slug: "plumbing-repairs" },
                        { name: "Roofing", description: "Roofing repairs and installation services to protect your home.", slug: "roofing" },
                        { name: "General Handyman Services", description: "Versatile handyman services for all your home repair and maintenance needs.", slug: "general-handyman-services" }
                    ];
                    _i = 0, servicesToSeed_1 = servicesToSeed;
                    _a.label = 1;
                case 1:
                    if (!(_i < servicesToSeed_1.length)) return [3 /*break*/, 4];
                    serviceData = servicesToSeed_1[_i];
                    return [4 /*yield*/, prisma.service.upsert({
                            where: { slug: serviceData.slug },
                            update: {},
                            create: serviceData
                        })];
                case 2:
                    service = _a.sent();
                    console.log("Created/updated service with id: ".concat(service.id, " (").concat(service.name, ")"));
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, bcryptjs_1["default"].hash('adminpassword123', 10)];
                case 5:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@example.com' },
                            update: {
                                name: 'Admin User',
                                role: client_1.UserRole.ADMIN
                            },
                            create: {
                                email: 'admin@example.com',
                                name: 'Admin User',
                                role: client_1.UserRole.ADMIN
                            }
                        })];
                case 6:
                    adminUser = _a.sent();
                    console.log("Created/updated admin user: ".concat(adminUser.email));
                    return [4 /*yield*/, bcryptjs_1["default"].hash('maintpassword123', 10)];
                case 7:
                    maintenancePassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'maintenance@example.com' },
                            update: {
                                name: 'Maintenance User',
                                role: client_1.UserRole.MAINTENANCE
                            },
                            create: {
                                email: 'maintenance@example.com',
                                name: 'Maintenance User',
                                role: client_1.UserRole.MAINTENANCE
                            }
                        })];
                case 8:
                    maintenanceUser = _a.sent();
                    console.log("Created/updated maintenance user: ".concat(maintenanceUser.email));
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 13, , 14]);
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: 'worker@example.com' } })];
                case 10:
                    oldWorker = _a.sent();
                    if (!oldWorker) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma.user["delete"]({ where: { email: 'worker@example.com' } })];
                case 11:
                    _a.sent();
                    console.log("Deleted old user: worker@example.com");
                    _a.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_1 = _a.sent();
                    // Non-critical error, might fail if user doesn't exist or has relations preventing delete
                    console.warn("Could not delete old worker@example.com user: ".concat(error_1.message));
                    return [3 /*break*/, 14];
                case 14: return [4 /*yield*/, prisma.siteSettings.upsert({
                        where: { id: 'default_settings' },
                        update: {
                            siteName: 'Dr. Handyman NC',
                            contactEmail: 'contact@drhandymannc.com',
                            contactPhone: '555-123-4567',
                            seoTitle: 'Dr. Handyman NC - Your Trusted Local Handyman',
                            seoDescription: 'Professional handyman services in Your Area. Contact us for carpentry, plumbing, electrical, and more.'
                        },
                        create: {
                            id: 'default_settings',
                            siteName: 'Dr. Handyman NC',
                            contactEmail: 'contact@drhandymannc.com',
                            contactPhone: '555-123-4567',
                            socialMedia: {
                                facebook: 'https://facebook.com/drhandymannc'
                            },
                            seoTitle: 'Dr. Handyman NC - Your Trusted Local Handyman',
                            seoDescription: 'Professional handyman services in Your Area. Contact us for carpentry, plumbing, electrical, and more.'
                        }
                    })];
                case 15:
                    siteSettings = _a.sent();
                    console.log("Created/updated site settings with id: ".concat(siteSettings.id));
                    console.log("Seeding finished.");
                    return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (e) {
    console.error(e);
    process.exit(1);
})["finally"](function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
